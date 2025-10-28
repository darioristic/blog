import { Redis } from "@upstash/redis";

// Mock Redis interface for local development
type MockRedis = {
  hgetall: (key: string) => Promise<Record<string, string>>;
  hget: (key: string, field: string) => Promise<string | null>;
  hincrby: (key: string, field: string, increment: number) => Promise<number>;
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<string>;
};

// Mock Redis for local development when token is not set
let redis: Redis | MockRedis;

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn("UPSTASH_REDIS_REST_TOKEN is not defined - using mock Redis for local development");
  redis = {
    hgetall: async () => ({}),
    hget: async () => "0",
    hincrby: async () => 1,
    get: async () => null,
    set: async () => "OK"
  };
} else {
  redis = new Redis({
    url: "https://global-apt-bear-30602.upstash.io",
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export default redis;
