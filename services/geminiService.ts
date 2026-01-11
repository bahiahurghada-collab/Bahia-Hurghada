
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

export const getSmartSummary = async (state: AppState) => {
  // Use process.env.API_KEY directly as per guidelines.
  if (!process.env.API_KEY) {
    return "AI insights are currently unavailable because the API key is not configured in the environment.";
  }

  try {
    // Correct initialization: use a named parameter `apiKey`.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const financialStats = {
      // Use state's live exchange rate instead of a fixed placeholder value.
      totalRevenue: state.bookings.reduce((acc, b) => acc + (b.currency === 'USD' ? b.paidAmount * state.currentExchangeRate : b.paidAmount), 0),
      totalExpenses: state.expenses.reduce((acc, e) => acc + (e.currency === 'USD' ? e.amount * state.currentExchangeRate : e.amount), 0),
      totalCommissions: state.bookings.reduce((acc, b) => acc + (b.currency === 'USD' ? b.commissionAmount * state.currentExchangeRate : b.commissionAmount), 0),
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

    // Complex reasoning tasks use 'gemini-3-pro-preview'.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        // Disable thinking for faster financial pulse check.
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    // Access response.text property (not a method).
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate financial analysis. Check connection.";
  }
};
