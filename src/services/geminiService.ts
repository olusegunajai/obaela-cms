import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  async askQuestion(prompt: string, history: { role: "user" | "model", parts: { text: string }[] }[] = []) {
    try {
      const chat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: "You are a knowledgeable assistant for OBA ELA TRADO, a traditional African healing and spiritual guidance center. You help users understand Ifa divination, herbalism, and spiritual items. Be respectful, wise, and helpful. If you don't know something specific about the center's current stock or schedules, advise them to check the store or consultation sections.",
        },
        history: history
      });

      const response = await chat.sendMessage({ message: prompt });
      return response.text || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I'm having trouble connecting to my wisdom source right now. Please try again later.";
    }
  }
};
