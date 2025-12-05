
import { GoogleGenAI } from "@google/genai";

// Declare process for TypeScript compatibility in non-Node environments or when types are missing
declare const process: {
  env: {
    API_KEY: string;
    [key: string]: any;
  }
};

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Uses Gemini to expand a short task instruction into a detailed production assignment.
 */
export const refineTaskDescription = async (shortInput: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `You are an expert production manager. 
    Refine the following short task instruction into a clear, professional task description for a production employee.
    Include a brief checklist of 3 items if applicable.
    Keep it concise (under 100 words).
    IMPORTANT: Output the result in Simplified Chinese.
    
    Input: "${shortInput}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return shortInput; // Fallback to original
  }
};
