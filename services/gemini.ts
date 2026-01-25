
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Memulakan client GoogleGenAI dengan selamat menggunakan process.env.API_KEY.
 * Mengelakkan ralat ReferenceError: process is not defined.
 */
function getAIClient() {
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  if (!apiKey) {
    console.warn("API Key Gemini tidak dijumpai. Ciri AI akan dilumpuhkan.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateOPRContent(unitName: string, title: string) {
  const ai = getAIClient();
  if (!ai) return null;

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
    
    const result = response.text;
    return result ? JSON.parse(result.trim()) : null;
  } catch (e) {
    console.error("Gemini OPR Error:", e);
    return null;
  }
}

export async function generatePikebmContent(activityName: string) {
  const ai = getAIClient();
  if (!ai) return null;
  
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
    const result = response.text;
    return result ? JSON.parse(result.trim()) : null;
  } catch (e) {
    console.error("Gemini PIKEBM Error:", e);
    return null;
  }
}

export async function generateSivikContent(theme: string) {
  const ai = getAIClient();
  if (!ai) return null;

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
    const result = response.text;
    return result ? JSON.parse(result.trim()) : null;
  } catch (e) {
    console.error("Gemini Sivik Error:", e);
    return null;
  }
}
