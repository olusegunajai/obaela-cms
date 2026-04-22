import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
    whatsapp?: string;
  };
  maintenanceMode: boolean;
  ecommerce: {
    defaultCurrency: string;
    taxRate: number;
    shippingFee: number;
    consultationPrice: number;
    paystackPublicKey: string;
  };
  appearance: {
    primaryColor: string;
    accentColor: string;
    fontFamily: 'serif' | 'sans' | 'mono';
  };
}

const SETTINGS_DOC_ID = 'site_settings';

export const settingsService = {
  async getSettings(): Promise<SiteSettings | null> {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SiteSettings;
    }
    return null;
  },

  subscribeToSettings(callback: (settings: SiteSettings | null) => void) {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SiteSettings);
      } else {
        callback(null);
      }
    });
  },

  async updateSettings(settings: SiteSettings) {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await setDoc(docRef, settings, { merge: true });
  }
};
