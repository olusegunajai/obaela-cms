import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface FAQ {
  id?: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
  createdAt: Timestamp | { seconds: number; nanoseconds: number } | null;
}

const COLLECTION_NAME = 'faqs';

export const faqService = {
  subscribeToFAQs: (callback: (faqs: FAQ[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const faqs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FAQ[];
      callback(faqs);
    });
  },

  addFAQ: async (faq: Omit<FAQ, 'id' | 'createdAt'>) => {
    return await addDoc(collection(db, COLLECTION_NAME), {
      ...faq,
      createdAt: Timestamp.now()
    });
  },

  updateFAQ: async (id: string, faq: Partial<FAQ>) => {
    const faqRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(faqRef, faq);
  },

  deleteFAQ: async (id: string) => {
    const faqRef = doc(db, COLLECTION_NAME, id);
    return await deleteDoc(faqRef);
  }
};
