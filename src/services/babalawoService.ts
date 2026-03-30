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

export interface Babalawo {
  id?: string;
  name: string;
  specialty: string;
  bio: string;
  imageUrl?: string;
  availability: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

const COLLECTION_NAME = 'babalawos';

export const babalawoService = {
  async createBabalawo(data: Omit<Babalawo, 'id'>) {
    return await addDoc(collection(db, COLLECTION_NAME), data);
  },

  subscribeToBabalawos(callback: (babalawos: Babalawo[]) => void) {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('name', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const babalawos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Babalawo[];
      callback(babalawos);
    }, (error) => {
      console.error("Error fetching babalawos:", error);
    });
  },

  async updateBabalawo(id: string, data: Partial<Babalawo>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(docRef, data);
  },

  async deleteBabalawo(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await deleteDoc(docRef);
  }
};
