
import { GoogleGenAI, Type } from "@google/genai";

// Fixed: Use process.env.API_KEY directly as per guidelines and avoid window.process which doesn't exist on Window type.
export async function generateOPRContent(unitName: string, title: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    
    // Fixed: Get text output via the .text property.
    const result = response.text;
    return result ? JSON.parse(result.trim()) : null;
  } catch (e) {
    console.error("Gemini OPR Error:", e);
    return null;
  }
}

// Fixed: Use process.env.API_KEY directly as per guidelines and avoid window.process.
export async function generatePikebmContent(activityName: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    // Fixed: Get text output via the .text property.
    const result = response.text;
    return result ? JSON.parse(result.trim()) : null;
  } catch (e) {
    console.error("Gemini PIKEBM Error:", e);
    return null;
  }
}

// Fixed: Use process.env.API_KEY directly as per guidelines and avoid window.process.
export async function generateSivikContent(theme: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    // Fixed: Get text output via the .text property.
    const result = response.text;
    return result ? JSON.parse(result.trim()) : null;
  } catch (e) {
    console.error("Gemini Sivik Error:", e);
    return null;
  }
}
