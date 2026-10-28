import {Redis} from 'ioredis';
import "dotenv/config";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is required");
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export function makeRedisClient(clientName: string): Redis {
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  client.on("error", (err) => {
    console.error(`Redis error [${clientName}]:`, err.message);
  });

  client.on("connect", () => {
    console.log(`Redis connected [${clientName}]`);
  });

  return client;
}

export const redis = makeRedisClient("main");
export const redisPub = makeRedisClient("publisher");
export const redisSub = makeRedisClient("subscriber");

export * from "./schema.js";

export const STREAM = {
  USER_REGISTRATION: "stream:user_registration",
} as const;

export interface UserRegistrationPayload {
    userId:    string,
    email:     string,
    timestamp: string;
}