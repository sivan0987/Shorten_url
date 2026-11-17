import { Redis } from "ioredis";
import { config } from "../config";

// One shared connection to Redis for the whole app.
// Redis is only a cache, so if it does not answer we give up fast and use Postgres instead.
export const redis = new Redis({
  ...config.redis,
  enableOfflineQueue: false, // no connection? fail immediately instead of queueing the command
  maxRetriesPerRequest: 1, // try each command at most once more, not 20 times
  commandTimeout: 200, // no answer within 200 ms? give up
});

// Without this, ioredis prints a long "Unhandled error event" on every reconnect attempt
redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});
