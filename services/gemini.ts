
import { GoogleGenAI, Type } from "@google/genai";

// Jangan define const ai di luar jika process.env.API_KEY belum sedia
// Namun mengikut garis panduan, kita definisikan satu kali menggunakan process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export async function generateOPRContent(unitName: string, title: string) {
  if (!process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hasilkan kandungan OPR Kokurikulum untuk unit "${unitName}" bagi aktiviti "${title}".
      Berikan dalam JSON:
      - objective: Senarai 3 objektif ringkas bernombor 1,2,3.
      - activity: Senarai 4 langkah aktiviti ringkas bernombor 1,2,3,4.
      - reflection: 1 ayat refleksi guru tentang impak perjumpaan ini.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objective: { type: Type.STRING },
            activity: { type: Type.STRING },
            reflection: { type: Type.STRING },
          },
          required: ["objective", "activity", "reflection"],
        },
      },
    });
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Gemini OPR Error:", e);
    return null;
  }
}

export async function generatePikebmContent(activityName: string) {
  if (!process.env.API_KEY) return null;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hasilkan sisipan PIKEBM untuk aktiviti "${activityName}". 
      Berikan JSON dengan:
      - materials: 1-2 bahan bantu mengajar.
      - steps: 3 langkah aktiviti bahasa ringkas (nombor 1, 2, 3).
      - reflection: 1 ayat ulasan kemahiran bahasa murid.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            materials: { type: Type.STRING },
            steps: { type: Type.STRING },
            reflection: { type: Type.STRING }
          },
          required: ["materials", "steps", "reflection"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Gemini PIKEBM Error:", e);
    return null;
  }
}

export async function generateSivikContent(theme: string) {
  if (!process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hasilkan kandungan Sivik bagi tema "${theme}".
      Berikan JSON dengan:
      - goal: Matlamat penerapan nilai tersebut.
      - activity: 3 langkah aktiviti penerapan nilai sivik ringkas (nombor 1, 2, 3).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goal: { type: Type.STRING },
            activity: { type: Type.STRING }
          },
          required: ["goal", "activity"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Gemini Sivik Error:", e);
    return null;
  }
}
