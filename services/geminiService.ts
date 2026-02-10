
import { GoogleGenAI, Type } from "@google/genai";
import { SubmissionPayload } from "../types";

const getApiKey = () => {
  try {
    // Check if process exists and has env, otherwise return empty string
    // This prevents "process is not defined" errors in browser-only environments
    return (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : '';
  } catch {
    return '';
  }
};

export const auditDataWithGemini = async (payload: SubmissionPayload): Promise<any> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn("Gemini API Key missing. Skipping AI audit.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Analyze the following daily dispatch and order data for a manufacturing/business context:
  Date: ${payload.date}
  Units Breakdown:
  ${Object.entries(payload.units).map(([unit, data]) => 
    `- ${unit}: Order Value = ${data.orderValue}, Dispatch Value = ${data.dispatchValue}`
  ).join('\n')}
  Total Order Value: ${payload.totalOrder}
  Total Dispatch Value: ${payload.totalDispatch}
  
  Provide a professional business summary, key operational insights (like dispatch-to-order ratio efficiency), and an overall business status recommendation.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            insights: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            status: { 
              type: Type.STRING,
              description: "One of: normal, warning, excellent"
            }
          },
          required: ["summary", "insights", "status"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    throw error;
  }
};
