import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Healer {
  id?: string;
  name: string;
  specialty: string;
  bio: string;
  imageUrl?: string;
  availability: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

const COLLECTION_NAME = 'healers';

export const healerService = {
  async createHealer(data: Omit<Healer, 'id'>) {
    return await addDoc(collection(db, COLLECTION_NAME), data);
  },

  subscribeToHealers(callback: (healers: Healer[]) => void) {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('name', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const healers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Healer[];
      callback(healers);
    }, (error) => {
      console.error("Error fetching healers:", error);
    });
  },

  async updateHealer(id: string, data: Partial<Healer>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(docRef, data);
  },

  async deleteHealer(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await deleteDoc(docRef);
  }
};
