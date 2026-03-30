import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export interface StaffMember {
  id?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  status: 'active' | 'inactive';
  profileVideoUrl?: string;
  joinedAt: { seconds: number; nanoseconds: number } | null;
  isAdmin?: boolean;
  permissions?: {
    menuAccess: string[];
    contentAccess: string[];
  };
}

export const staffService = {
  async addStaff(staffData: Omit<StaffMember, 'id' | 'joinedAt'>) {
    const staffRef = collection(db, 'staff');
    return addDoc(staffRef, {
      ...staffData,
      joinedAt: serverTimestamp()
    });
  },

  async updateStaff(staffId: string, staffData: Partial<StaffMember>) {
    const staffRef = doc(db, 'staff', staffId);
    return updateDoc(staffRef, {
      ...staffData,
      updatedAt: serverTimestamp()
    });
  },

  async deleteStaff(staffId: string) {
    const staffRef = doc(db, 'staff', staffId);
    return deleteDoc(staffRef);
  },

  subscribeToStaff(callback: (staff: StaffMember[]) => void) {
    const q = query(collection(db, 'staff'), orderBy('joinedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const staff = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffMember[];
      callback(staff);
    });
  }
};
