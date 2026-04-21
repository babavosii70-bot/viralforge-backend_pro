import express from "express";
import { upload as videoUpload } from "../controllers/video.controller";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Mount the high-fidelity video upload controller
// This ensures the dashboard's 200 videos/day pipeline remains fully functional
// while exposing the requested modular endpoint.
router.post("/", authenticate, videoUpload);

export default router;
