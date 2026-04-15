import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  glassOpacity: string;
  sidebarStyle: 'light' | 'dark' | 'glass';
  youtubeChannelId?: string;
  youtubeApiKey?: string;
}

const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#F27D26',
  secondaryColor: '#141414',
  accentColor: '#FFD700',
  backgroundColor: '#f5f5f0',
  textColor: '#1a1a1a',
  fontFamily: 'Cormorant Garamond',
  borderRadius: '32px',
  glassOpacity: '0.15',
  sidebarStyle: 'light'
};

export const themeService = {
  async saveTheme(theme: ThemeSettings) {
    const themeRef = doc(db, 'settings', 'theme');
    return setDoc(themeRef, {
      key: 'theme',
      value: theme,
      updatedAt: serverTimestamp()
    });
  },

  async getTheme(): Promise<ThemeSettings> {
    const themeRef = doc(db, 'settings', 'theme');
    const snapshot = await getDoc(themeRef);
    if (snapshot.exists()) {
      return snapshot.data().value as ThemeSettings;
    }
    return DEFAULT_THEME;
  },

  subscribeToTheme(callback: (theme: ThemeSettings) => void) {
    const themeRef = doc(db, 'settings', 'theme');
    return onSnapshot(themeRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data().value as ThemeSettings);
      } else {
        callback(DEFAULT_THEME);
      }
    });
  },

  async generateThemeAI(prompt: string): Promise<ThemeSettings> {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `You are a world-class UI/UX designer. Based on the user's prompt, generate a cohesive and premium theme for a traditional African healing and spiritual website (OBA ELA TRADO). 
      
      User Prompt: "${prompt}"
      
      The theme should include:
      - primaryColor (hex)
      - secondaryColor (hex)
      - accentColor (hex)
      - backgroundColor (hex)
      - textColor (hex)
      - fontFamily (e.g., 'Inter', 'Cormorant Garamond', 'Montserrat', 'Playfair Display')
      - borderRadius (e.g., '8px', '16px', '32px', '9999px')
      - glassOpacity (e.g., '0.1', '0.2', '0.3')
      - sidebarStyle ('light', 'dark', or 'glass')
      
      Return ONLY the JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryColor: { type: Type.STRING },
            secondaryColor: { type: Type.STRING },
            accentColor: { type: Type.STRING },
            backgroundColor: { type: Type.STRING },
            textColor: { type: Type.STRING },
            fontFamily: { type: Type.STRING },
            borderRadius: { type: Type.STRING },
            glassOpacity: { type: Type.STRING },
            sidebarStyle: { type: Type.STRING, enum: ['light', 'dark', 'glass'] },
            youtubeChannelId: { type: Type.STRING },
            youtubeApiKey: { type: Type.STRING }
          },
          required: ["primaryColor", "secondaryColor", "accentColor", "backgroundColor", "textColor", "fontFamily", "borderRadius", "glassOpacity", "sidebarStyle"]
        }
      }
    });

    try {
      const theme = JSON.parse(response.text);
      return theme as ThemeSettings;
    } catch (error) {
      console.error("Failed to parse AI theme response:", error);
      throw new Error("Failed to generate theme. Please try a different prompt.", { cause: error });
    }
  }
};
