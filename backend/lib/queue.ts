import { Queue } from "bullmq";
import redis, { getRedisStatus } from "./redis.js";

const isRedisDisabled = process.env.DISABLE_REDIS === "true";

// Helper to create a queue or a shim
const createQueue = (name: string) => {
  if (isRedisDisabled) {
    console.warn(`[Queue] ${name} is using local shim (DISABLE_REDIS=true)`);
    return {
      add: async (jobName: string, data: any) => {
        console.log(`[Queue Shim] Job ${jobName} recorded in system (Local poller will pick it up)`);
        return { id: "shim-" + Date.now() };
      }
    } as any;
  }

  return new Queue(name, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
    },
  });
};

export const videoQueue = createQueue("video-processing");
export const autoGenerateQueue = createQueue("auto-generation");

// Export redis for the worker
export const redisConnection = redis;

console.log("🚀 BullMQ Video Queue initialized (Self-Healing Mode)");
