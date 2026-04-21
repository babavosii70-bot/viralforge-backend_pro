import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Diagnostic: Ensure the key is present (masked)
const API_KEY = (process.env.GEMINI_API_KEY || (process.env as any).VITE_GEMINI_API_KEY || "").trim();
if (!API_KEY || API_KEY === "GEMINI_API_KEY") {
  console.warn("[AI Service] WARNING: GEMINI_API_KEY is missing or invalid in environment.");
} else {
  console.log(`[AI Service] GEMINI_API_KEY detected (len: ${API_KEY.length}): ${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateVideoScript(topic: string = "productivity and deep work"): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, impactful 1-sentence viral video script about ${topic}. Keep it under 15 words. Just the text.`,
    });

    return response.text?.trim() || "The future of AI is here, and it's rendering at 60fps.";
  } catch (error) {
    console.error("[AI Service] Gemini Error:", error);
    return "ForgeEngine: Mastering the autonomous media pipeline.";
  }
}
