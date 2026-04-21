import * as db from "../db/index";
import { v4 as uuidv4 } from "uuid";

interface OptimizationState {
  ffmpegPreset: string;
  resolution: string;
}

export let currentConfig: OptimizationState = {
  ffmpegPreset: "veryfast",
  resolution: "1080x1920"
};

export async function startOptimizationLoop() {
  console.log("[AI Optimization] Loop active - Monitoring job performance every 5 minutes");

  setInterval(async () => {
    try {
      const jobs: any[] = await db.all("SELECT * FROM videos ORDER BY createdAt DESC LIMIT 20");
      
      if (jobs.length < 5) return; // Wait for more data

      const failedJobs = jobs.filter(j => j.status === "FAILED");
      const failureRate = failedJobs.length / jobs.length;

      let reason = "Performance stable";
      const oldPreset = currentConfig.ffmpegPreset;

      if (failureRate > 0.3) {
        currentConfig.ffmpegPreset = "ultrafast";
        reason = `High failure rate (${(failureRate * 100).toFixed(1)}%). Reducing FFmpeg complexity.`;
      } else if (failureRate < 0.05 && jobs.length >= 15) {
        currentConfig.ffmpegPreset = "medium";
        reason = "High success rate. Increasing quality preset to medium.";
      }

      if (oldPreset !== currentConfig.ffmpegPreset) {
        console.log(`[AI Optimization] Decision: ${reason}`);
        await db.run(
          "INSERT INTO optimization_logs (id, videoId, type, suggestion, timestamp) VALUES (?, ?, ?, ?, ?)",
          [uuidv4(), "SYSTEM", "PRESET_ADJUSTMENT", reason, new Date().toISOString()]
        );
      }

    } catch (error) {
      console.error("[AI Optimization] Error in loop:", error);
    }
  }, 5 * 60 * 1000); // 5 minutes
}
