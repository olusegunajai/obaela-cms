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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

    try {
      return await addDoc(collection(db, COLLECTION_NAME), newConsultation);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
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
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  subscribeToAllConsultations(callback: (consultations: Consultation[]) => void) {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const consultations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Consultation[];
      callback(consultations);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  async updateStatus(id: string, status: ConsultationStatus) {
    const docRef = doc(db, COLLECTION_NAME, id);
    try {
      return await updateDoc(docRef, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  }
};
