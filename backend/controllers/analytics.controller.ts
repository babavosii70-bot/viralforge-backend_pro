import { Request, Response } from "express";
import * as db from "../db/index";

export const track = async (req: Request, res: Response) => {
  const { videoId, event } = req.body;

  try {
    if (event === "view") {
      await db.run("UPDATE videos SET views = views + 1 WHERE id = ?", [videoId]);
    }
    
    // Real-time update via Socket.io would happen here
    const io = (req as any).io;
    if (io) {
      io.emit(`video:${videoId}:analytics`, { event });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getReport = async (req: Request, res: Response) => {
  try {
    const video: any = await db.get("SELECT * FROM videos WHERE id = ?", [req.params.id]);
    if (!video) return res.status(404).json({ error: "Not found" });
    
    // Simulate complex report generation
    res.json({
      videoId: video.id,
      totalViews: video.views || 0,
      retentionCurve: [100, 95, 90, 85, 80],
      optimizationSuggestions: [
        { type: "HOOK", message: "Initial 3 seconds could use sharper audio transitions." },
        { type: "TIMING", message: "Mid-section pace drops. Consider cutting 2.5s of silence." }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
