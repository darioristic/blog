/**
 * Upstash-REST-compatible HTTP proxy for a local Redis.
 *
 * Lets Vercel functions talk to a self-hosted Redis over HTTPS without
 * exposing the Redis port. The `@upstash/redis` client works unchanged --
 * only UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN point here instead.
 *
 * Listens on loopback only; nginx terminates TLS in front of it.
 */
import http from "node:http";
import { timingSafeEqual } from "node:crypto";
import Redis, { Command } from "ioredis";

const PORT = Number(process.env.PORT ?? 8079);
const HOST = process.env.HOST ?? "127.0.0.1";
const TOKEN = process.env.SRH_TOKEN;
const CONNECTION = process.env.SRH_CONNECTION_STRING ?? "redis://127.0.0.1:6379";
const MAX_BODY = 1024 * 1024;

// This Redis instance is shared with other apps on the box, so a leaked token
// must not be able to touch anything but the blog's view counters.
const ALLOWED_COMMANDS = new Set(
  (process.env.SRH_ALLOWED_COMMANDS ?? "ping,hget,hgetall,hmget,hlen,hincrby,hset")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
);
const KEY_PREFIX = process.env.SRH_KEY_PREFIX ?? "views";

if (!TOKEN) {
  console.error("SRH_TOKEN is required");
  process.exit(1);
}

// ioredis turns HGETALL into an object, but the Upstash REST API returns a
// flat [field, value, ...] array -- and the SDK's deserializer indexes into it
// by two. Without this the client silently decodes every hash to null.
Command.setReplyTransformer("hgetall", reply => reply);

const redis = new Redis(CONNECTION, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
  enableOfflineQueue: true,
});
redis.on("error", err => console.error("[redis]", err.message));
redis.on("connect", () => console.log("[redis] connected to", CONNECTION.replace(/\/\/.*@/, "//***@")));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Inverse of the `@upstash/redis` base64 decoder. "OK" is passed through verbatim. */
function encodeBase64(value) {
  if (Array.isArray(value)) return value.map(encodeBase64);
  if (typeof value === "string") {
    return value === "OK" ? "OK" : Buffer.from(value, "utf8").toString("base64");
  }
  if (Buffer.isBuffer(value)) return value.toString("base64");
  return value;
}

function tokenMatches(provided) {
  const a = Buffer.from(provided);
  const b = Buffer.from(TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

function authorize(req) {
  const header = req.headers.authorization ?? "";
  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value || !tokenMatches(value)) {
    throw new HttpError(401, "Unauthorized");
  }
}

async function runCommand(command) {
  if (!Array.isArray(command) || command.length === 0) {
    throw new HttpError(400, "Command must be a non-empty array");
  }
  const name = String(command[0]).toLowerCase();
  if (!ALLOWED_COMMANDS.has(name)) {
    throw new HttpError(403, `Command not allowed: ${name}`);
  }
  if (name !== "ping" && KEY_PREFIX) {
    const key = String(command[1] ?? "");
    if (!key.startsWith(KEY_PREFIX)) {
      throw new HttpError(403, `Key not allowed: ${key}`);
    }
  }
  // `.call` bypasses ioredis' reply transformers, so HGETALL stays a flat
  // array -- which is exactly what the Upstash REST API returns.
  const args = command.slice(1).map(arg => (arg === null || arg === undefined ? "" : String(arg)));
  return redis.call(name, ...args);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, "Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname.replace(/\/+$/, "") || "/";

  try {
    if (path === "/health") {
      const pong = await redis.ping();
      return send(res, pong === "PONG" ? 200 : 503, { ok: pong === "PONG" });
    }

    authorize(req);

    const encode = req.headers["upstash-encoding"] === "base64" ? encodeBase64 : v => v;

    if (req.method !== "POST") {
      throw new HttpError(405, "Method not allowed");
    }

    const raw = await readBody(req);
    let body;
    try {
      body = raw === "" ? null : JSON.parse(raw);
    } catch {
      throw new HttpError(400, "Invalid JSON body");
    }

    if (path === "/pipeline" || path === "/multi-exec") {
      if (!Array.isArray(body) || body.length === 0) {
        throw new HttpError(400, "Pipeline body must be a non-empty array of commands");
      }
      const results = [];
      for (const command of body) {
        try {
          results.push({ result: encode(await runCommand(command)) });
        } catch (err) {
          results.push({ error: err.message });
        }
      }
      return send(res, 200, results);
    }

    if (path === "/") {
      return send(res, 200, { result: encode(await runCommand(body)) });
    }

    throw new HttpError(404, "Not found");
  } catch (err) {
    if (err instanceof HttpError) {
      return send(res, err.status, { error: err.message });
    }
    console.error("[proxy]", err);
    return send(res, 400, { error: err.message ?? "Internal error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[proxy] listening on http://${HOST}:${PORT}`);
  console.log(`[proxy] commands: ${[...ALLOWED_COMMANDS].join(", ")} | key prefix: ${KEY_PREFIX || "(any)"}`);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.close(() => redis.quit().finally(() => process.exit(0)));
  });
}
