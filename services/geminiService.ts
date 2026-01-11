
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

// دالة مساعدة للحصول على المفتاح بأمان دون كسر التطبيق
const getApiKey = () => {
  try {
    // نتحقق من وجود process أولاً
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Environment variables not accessible");
  }
  return null;
};

export const getSmartSummary = async (state: AppState) => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "AI insights are currently unavailable because the API key is not configured in the environment.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Analyze the following PMS data for Bahia Hurghada and provide a professional business summary.
      Data:
      - Total Apartments: ${state.apartments.length}
      - Total Bookings: ${state.bookings.length}
      - Total Customers: ${state.customers.length}
      - Current Active Bookings: ${state.bookings.filter(b => b.status === 'confirmed').length}
      
      Recent Bookings Details (Sample): ${JSON.stringify(state.bookings.slice(-5))}

      Please provide:
      1. A short summary of the current occupancy.
      2. Revenue insights.
      3. Suggestions for improvements based on these numbers.
      Keep the response concise and professional in English.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate smart summary at this moment. Please check your API limits.";
  }
};
