# redis-http

An Upstash-REST-compatible HTTP proxy that lets Vercel functions read and write
the Redis running on the origin server (116.203.149.70) without exposing the
Redis port to the internet.

## Why

Vercel functions have no static egress IPs outside Enterprise Secure Compute, so
a Redis reachable from Vercel cannot be protected by an IP allowlist. Instead of
opening port 6379, this proxy listens on loopback, speaks the Upstash REST
protocol, and sits behind nginx which terminates TLS.

The upside is that `app/redis.ts` needs no special client: `@upstash/redis` works
unchanged, only `UPSTASH_REDIS_REST_URL` points at `redis.darioristic.com`
instead of `*.upstash.io`.

## Blast radius

The Redis on that box is shared with other applications (~9.5k keys). A leaked
token must not be able to reach them, so the proxy enforces two limits:

- `SRH_ALLOWED_COMMANDS` — only the hash commands the blog needs. `FLUSHALL`,
  `KEYS`, `SCAN` and everything else are rejected with 403.
- `SRH_KEY_PREFIX` — commands may only touch keys starting with `views`.

## Protocol notes

Two details of the Upstash REST protocol are easy to get wrong:

- **HGETALL must return a flat `[field, value, ...]` array.** ioredis transforms
  it into an object; the `@upstash/redis` deserializer indexes into the reply by
  two and silently returns `null` for an object. `Command.setReplyTransformer`
  disables that transform.
- **Base64.** The SDK sends `Upstash-Encoding: base64` by default and decodes
  every string in the reply, except the literal `"OK"`. The proxy mirrors that
  exactly, and falls back to plain JSON when the header is absent (handy for
  `curl`).

## Configuration

`/opt/redis-http/.env` on the server, mode 600:

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `8079` | Listen port |
| `HOST` | `127.0.0.1` | Bind address — keep on loopback |
| `SRH_TOKEN` | *(required)* | Bearer token clients must present |
| `SRH_CONNECTION_STRING` | `redis://127.0.0.1:6379` | Upstream Redis |
| `SRH_ALLOWED_COMMANDS` | `ping,hget,hgetall,hmget,hlen,hincrby,hset` | Allowlist |
| `SRH_KEY_PREFIX` | `views` | Only keys with this prefix are reachable |

## Operating

```bash
# on the server, as the darioristic user
pm2 restart redis-http --update-env
pm2 logs redis-http

# health check, no auth required
curl -s http://127.0.0.1:8079/health

# manual query
curl -s -X POST http://127.0.0.1:8079/ \
  -H "Authorization: Bearer $SRH_TOKEN" \
  -d '["HGETALL","views"]'
```

## Deploying a change

```bash
scp server.mjs root@116.203.149.70:/opt/redis-http/server.mjs
ssh root@116.203.149.70 'chown darioristic:darioristic /opt/redis-http/server.mjs
  && sudo -u darioristic pm2 restart redis-http'
```

## View counter history

The counters were split across two stores: Upstash held the history from the
Vercel era (460 views), the origin Redis held everything since the move to
self-hosting (43 views). They were merged with `HINCRBY` on 2026-08-24 to a
total of 503, guarded by the key `views:migration:upstash-history` so a rerun
cannot double-count. A snapshot of the pre-merge state is in
`/opt/redis-http/views-backup-20260824-140704.txt`.

The Upstash database still exists and is untouched — it is the rollback.
