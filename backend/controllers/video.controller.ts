import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import * as db from "../db/index";
import { videoQueue } from "../lib/queue";

const UPLOADS_DIR = path.resolve(process.cwd(), process.env.UPLOADS_PATH || process.env.STORAGE_PATH || "uploads");
const OUTPUTS_DIR = path.resolve(process.cwd(), process.env.OUTPUTS_PATH || "outputs");

[UPLOADS_DIR, OUTPUTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${uuidv4()}-${file.originalname}`);
  }
});

const uploadMiddleware = multer({ storage }).single("video");

export const upload = (req: any, res: Response) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const videoId = uuidv4();
      const videoData = {
        id: videoId,
        userId: req.user.id,
        filename: req.file.filename,
        originalPath: req.file.path,
        status: "PENDING",
        progress: 0,
        createdAt: new Date().toISOString()
      };

      await db.run(
        "INSERT INTO videos (id, userId, filename, originalPath, status, progress, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [videoData.id, videoData.userId, videoData.filename, videoData.originalPath, videoData.status, videoData.progress, videoData.createdAt]
      );
      
      const outputPath = path.join(OUTPUTS_DIR, `processed-${videoData.filename}`);
      
      await videoQueue.add("process-video", {
        videoId: videoData.id,
        input: videoData.originalPath,
        output: outputPath,
        filename: videoData.filename
      });

      res.status(201).json({ 
        message: "Video added to queue", 
        ...videoData 
      });
    } catch (error: any) {
      console.error("[Video Controller] Upload failure:", error);
      res.status(500).json({ error: error.message });
    }
  });
};

export const getAll = async (req: any, res: Response) => {
  try {
    let videos;
    if (req.user.role === "ADMIN") {
      videos = await db.all("SELECT * FROM videos ORDER BY createdAt DESC");
    } else {
      videos = await db.all("SELECT * FROM videos WHERE userId = ? ORDER BY createdAt DESC", [req.user.id]);
    }
    res.json(videos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const video = await db.get("SELECT * FROM videos WHERE id = ?", [req.params.id]);
    if (!video) return res.status(404).json({ error: "Not found" });
    res.json(video);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
