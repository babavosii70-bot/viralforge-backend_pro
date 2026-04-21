import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let isRedisConnected = false;
let hasLoggedFailure = false;
const isRedisDisabled = process.env.DISABLE_REDIS === "true";

const redis = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  showFriendlyErrorStack: false,
  retryStrategy: (times) => {
    if (isRedisDisabled || times >= 2) {
      isRedisConnected = false;
      return null;
    }
    return 500;
  }
});

if (!isRedisDisabled) {
  redis.on("connect", () => {
    console.log("✅ Redis connected");
    isRedisConnected = true;
    hasLoggedFailure = false;
  });

  redis.on("error", (err: any) => {
    isRedisConnected = false;
    if (err.code === "ECONNREFUSED") {
      if (!hasLoggedFailure) {
        console.warn("⚠️ Redis unavailable. Operating in local failover mode.");
        hasLoggedFailure = true;
      }
    } else {
      if (!hasLoggedFailure) {
         console.error("❌ Redis error:", err.message);
         hasLoggedFailure = true;
      }
    }
  });

  redis.connect().catch(() => {
    isRedisConnected = false;
    hasLoggedFailure = true;
  });
} else {
  isRedisConnected = false;
  hasLoggedFailure = true; // Prevents spamming failover logs if we explicitly disabled it
}

export const getRedisStatus = () => isRedisConnected;
export default redis;
