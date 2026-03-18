import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

export type UserRole = 'super-admin' | 'admin' | 'client';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  adminLevel?: number;
  adminCategory?: string;
  photoURL?: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export const authService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  async ensureUserProfile(user: FirebaseUser): Promise<UserProfile> {
    const existing = await this.getUserProfile(user.uid);
    if (existing) return existing;

    // Default admin email from rules
    const isAdmin = user.email === 'dbest4real2009@gmail.com';
    
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'User',
      role: isAdmin ? 'super-admin' : 'client',
      photoURL: user.photoURL || undefined,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', user.uid), newProfile);
    return newProfile;
  },

  subscribeToAllUsers(callback: (users: UserProfile[]) => void) {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserProfile[];
      callback(users);
    });
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const docRef = doc(db, 'users', uid);
    return await updateDoc(docRef, data);
  }
};
