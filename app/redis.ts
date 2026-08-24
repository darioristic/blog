import { Redis } from "@upstash/redis";

// Speaks the Upstash REST protocol, but the URL points at our own proxy
// (infra/redis-http) in front of the Redis on the origin server.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export default redis;
