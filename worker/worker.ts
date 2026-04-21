import "dotenv/config";
import { Worker } from "bullmq";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "ffmpeg-static";
import path from "path";
import fs from "fs-extra";
import { redisConnection } from "../backend/lib/queue.js";
import { getRedisStatus } from "../backend/lib/redis.js";
import * as db from "../backend/db/index.js";

// Set FFmpeg path
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
} else if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller);
}

const OUTPUTS_PATH = process.env.OUTPUTS_PATH || "./outputs";
const isRedisDisabled = process.env.DISABLE_REDIS === "true";

// Ensure outputs dir exists
fs.ensureDirSync(OUTPUTS_PATH);

console.log("🧠 ForgeEngine Worker starting...");

const processor = async (job: any) => {
  const { inputPath, outputPath, videoId, script } = job.data;
  const id = videoId || job.data.id;
  
  console.log(`[Worker] Job ${job.id}: Processing ${path.basename(inputPath || "generated-video")}`);

  try {
    // Update DB status to processing
    if (id) {
      await db.run(
        "UPDATE videos SET status = 'PROCESSING', progress = 10, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );
    }

    if (inputPath && !(await fs.pathExists(inputPath))) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    await new Promise((resolve, reject) => {
      let command: any;
      
      if (script && !inputPath) {
        // Auto-generation logic shim
        const sanitizedScript = script.replace(/'/g, "'\\''");
        command = ffmpeg()
          .input("color=c=black:s=1080x1920:d=10")
          .inputFormat("lavfi")
          .videoFilters([
            {
              filter: 'drawtext',
              options: {
                text: sanitizedScript,
                fontcolor: 'white',
                fontsize: 48,
                x: '(w-text_w)/2',
                y: '(h-text_h)/2'
              }
            }
          ]);
      } else {
        command = ffmpeg(inputPath)
          .videoCodec("libx264")
          .audioCodec("aac")
          .fps(60)
          .size("1080x1920");
      }

      command
        .on("start", (cmd: string) => console.log(`[FFmpeg] Started: ${cmd}`))
        .on("progress", (progress: any) => {
          if (progress.percent && id) {
            db.run("UPDATE videos SET progress = ? WHERE id = ?", [Math.round(progress.percent), id]);
          }
        })
        .on("error", (err: Error) => {
          console.error(`❌ [Job ${job.id}] FFmpeg Error:`, err.message);
          reject(err);
        })
        .on("end", () => {
          console.log(`✅ [Job ${job.id}] Processing complete: ${outputPath}`);
          resolve(true);
        })
        .save(outputPath);
    });

    if (id) {
      await db.run(
        "UPDATE videos SET status = 'COMPLETED', progress = 100, processedPath = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        [outputPath, id]
      );
    }
  } catch (err: any) {
    console.error(`❌ Job ${job.id} failed:`, err.message);
    if (id) {
      await db.run(
        "UPDATE videos SET status = 'FAILED', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );
    }
    throw err;
  }
};

const startWorker = () => {
  if (isRedisDisabled) {
    console.warn("⚠️ Redis disabled. Starting Local Poller Mode.");
    startPoller();
    return;
  }

  try {
    const worker = new Worker("video-processing", processor, {
      connection: redisConnection,
      concurrency: 2,
      lockDuration: 60000,
    });

    worker.on("completed", (job) => console.log(`[Worker] Job ${job.id} completed.`));
    worker.on("failed", (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message));
    
    console.log("👷 Worker listening via BullMQ...");
  } catch (err) {
    console.error("❌ BullMQ failed to start:", err);
    startPoller();
  }
};

const startPoller = () => {
  setInterval(async () => {
    try {
      const pending: any[] = await db.all("SELECT * FROM videos WHERE status = 'PENDING' LIMIT 1");
      if (pending.length > 0) {
        const video = pending[0];
        const UPLOADS_DIR = path.resolve(process.cwd(), process.env.UPLOADS_PATH || "uploads");
        const OUTPUTS_DIR = path.resolve(process.cwd(), process.env.OUTPUTS_PATH || "outputs");
        
        const jobData = {
          id: 'poll-' + video.id,
          data: {
            videoId: video.id,
            inputPath: video.originalPath || path.join(UPLOADS_DIR, video.filename),
            outputPath: video.processedPath || path.join(OUTPUTS_DIR, `processed-${video.filename}`),
            script: video.script
          }
        };
        await processor(jobData);
      }
    } catch (err) {
      console.error("[Poller] Error:", err);
    }
  }, 5000);
  console.log("🕵️ Local Poller active (checking DB every 5s)");
};

// Delayed start to allow DB/Redis init
setTimeout(startWorker, 2000);
