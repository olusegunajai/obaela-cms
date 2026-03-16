import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export enum ConsultationType {
  IFA_DIVINATION = "Ifa Divination",
  SPIRITUAL_GUIDANCE = "Spiritual Guidance",
  DESTINY_READING = "Destiny Reading",
  SPIRITUAL_CLEANSING = "Spiritual Cleansing",
  TRADITIONAL_HEALING = "Traditional Healing"
}

export enum ConsultationStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export interface Consultation {
  id?: string;
  clientUid: string;
  healerId?: string;
  healerName?: string;
  type: ConsultationType;
  status: ConsultationStatus;
  scheduledAt: string;
  questions: string;
  results?: string;
  paymentStatus: "unpaid" | "paid";
  createdAt: string;
}

const COLLECTION_NAME = 'consultations';

export const consultationService = {
  async createConsultation(data: Omit<Consultation, 'id' | 'createdAt' | 'status' | 'paymentStatus'>) {
    if (!auth.currentUser) throw new Error("User must be authenticated");

    const newConsultation: Omit<Consultation, 'id'> = {
      ...data,
      clientUid: auth.currentUser.uid,
      status: ConsultationStatus.PENDING,
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString()
    };

    return await addDoc(collection(db, COLLECTION_NAME), newConsultation);
  },

  subscribeToUserConsultations(callback: (consultations: Consultation[]) => void) {
    if (!auth.currentUser) return () => {};

    const q = query(
      collection(db, COLLECTION_NAME),
      where('clientUid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const consultations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Consultation[];
      callback(consultations);
    }, (error) => {
      console.error("Error fetching consultations:", error);
    });
  },

  async updateStatus(id: string, status: ConsultationStatus) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(docRef, { status });
  }
};
