import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs-extra";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import morgan from "morgan";
import { videoQueue } from "./backend/lib/queue.js";
import { createServer as createViteServer } from "vite";

const app = express();

const PORT = parseInt(process.env.PORT || "3000", 10);
const STORAGE_PATH = process.env.STORAGE_PATH;
const UPLOADS_PATH = process.env.UPLOADS_PATH || "./uploads";
const OUTPUTS_PATH = process.env.OUTPUTS_PATH || "./outputs";

// ===== AUTO CREATE DIRECTORIES =====
const paths = [
  STORAGE_PATH,
  UPLOADS_PATH,
  OUTPUTS_PATH,
  process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : "./data"
];

if (process.env.AUTO_CREATE_DIR === "true") {
  paths.forEach((p) => {
    if (p && !fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
      console.log("Created:", p);
    }
  });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_PATH);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Static Serving
app.use("/uploads", express.static(path.resolve(UPLOADS_PATH)));
app.use("/outputs", express.static(path.resolve(OUTPUTS_PATH)));

// 2. ROUTES

// Health diagnostic routes
app.get("/", (req, res) => {
  res.send("ForgeEngine API Running ✅");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Upload route
app.post("/upload", upload.single("video"), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "No video provided" });
    }

    const filename = req.file.filename;
    const inputPath = req.file.path;
    const outputFilename = `processed-${filename}`;
    const outputPath = path.resolve(OUTPUTS_PATH, outputFilename);

    // Add job to BullMQ
    const job = await videoQueue.add("process-video", {
      inputPath,
      outputPath,
      filename
    });

    res.status(202).json({ 
      status: "queued", 
      jobId: job.id,
      file: filename,
      outputUrl: `/outputs/${outputFilename}`
    });
  } catch (err: any) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Root route is handled above in the "Health diagnostic routes" section.

// Vite middleware for development - keep our SPA working
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("❌ Global Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 ForgeEngine running on port ${PORT}`);
});
