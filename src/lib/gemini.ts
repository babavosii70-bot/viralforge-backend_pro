import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateViralScript(niche: string, trends: string[]) {
  const prompt = `
    You are a viral content strategist for TikTok and YouTube Shorts.
    Create a 30-second viral video script for the following niche: ${niche}.
    Consider these current trends: ${trends.join(", ")}.
    
    Structure the script as follows:
    - 0-3s: Aggressive Hook (Curiosity driven, curiosity gap, or controversial statement)
    - 3-25s: Fast-paced value delivery or core storytelling
    - 25-30s: Loop-friendly ending (the end of the script should flow perfectly back into the hook).
    
    Return the response in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      systemInstruction: "You only output JSON focusing on high-retention viral scripts.",
    },
  });

  return JSON.parse(response.text);
}

export async function analyzeTrends() {
  const prompt = `
    Analyze current viral trends on TikTok and YouTube Shorts.
    Identify the top 3 niches or topics that are likely to go viral today.
    Return a JSON array of objects with 'topic', 'platform', and 'score' (1-100).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text);
}
