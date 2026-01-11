
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

export const getSmartSummary = async (state: AppState) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return "AI insights are currently unavailable because the API key is not configured in the environment.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const financialStats = {
      totalRevenue: state.bookings.reduce((acc, b) => acc + (b.currency === 'USD' ? b.paidAmount * 50 : b.paidAmount), 0),
      totalExpenses: state.expenses.reduce((acc, e) => acc + (e.currency === 'USD' ? e.amount * 50 : e.amount), 0),
      totalCommissions: state.bookings.reduce((acc, b) => acc + (b.currency === 'USD' ? b.commissionAmount * 50 : b.commissionAmount), 0),
      units: state.apartments.length,
      activeStays: state.bookings.filter(b => b.status === 'stay').length
    };

    const prompt = `
      Act as a world-class hospitality financial consultant for "Bahia Hurghada".
      Current Financial Pulse:
      - Estimated Gross Revenue: ${financialStats.totalRevenue} EGP
      - Operational Expenses: ${financialStats.totalExpenses} EGP
      - Staff/Channel Commissions: ${financialStats.totalCommissions} EGP
      - Occupancy Rate: ${((financialStats.activeStays / financialStats.units) * 100).toFixed(1)}%
      
      Tasks:
      1. Analyze the Net Profit Margin based on these numbers.
      2. Identify if expenses are too high relative to revenue.
      3. Provide 3 specific, sharp business tips to increase net profit (e.g., dynamic pricing, utility saving, or direct booking focus).
      
      Keep the tone professional, direct, and elite. English response.
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
    return "Could not generate financial analysis. Check connection.";
  }
};
