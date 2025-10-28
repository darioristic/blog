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
const mockViews: Record<string, number> = {};

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn("UPSTASH_REDIS_REST_TOKEN is not defined - using mock Redis for local development");
  redis = {
    hgetall: async () => mockViews,
    hget: async (key: string, field: string) => String(mockViews[field] ?? 0),
    hincrby: async (key: string, field: string, increment: number) => {
      mockViews[field] = (mockViews[field] ?? 0) + increment;
      return mockViews[field];
    },
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
