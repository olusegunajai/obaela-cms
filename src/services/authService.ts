import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  getDocFromServer,
  deleteDoc
} from 'firebase/firestore';
import { 
  User as FirebaseUser, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from 'firebase/auth';
import { auth, db } from '../firebase';

export type UserRole = 'super-admin' | 'admin' | 'client';

export interface UserPermissions {
  menuAccess: string[]; // List of tab IDs
  contentAccess: string[]; // List of content types
}

export enum OperationType {
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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
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
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  adminLevel?: number;
  adminCategory?: string;
  hasPremiumAccess?: boolean;
  photoURL?: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  permissions?: UserPermissions;
}

export const authService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      return null;
    }
  },

  async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. ");
      }
    }
  },

  async ensureUserProfile(user: FirebaseUser): Promise<UserProfile> {
    const existing = await this.getUserProfile(user.uid);
    const isAdminEmail = user.email === 'dbest4real2009@gmail.com';

    if (existing) {
      if (isAdminEmail && existing.role !== 'super-admin') {
        const updatedProfile = { ...existing, role: 'super-admin' as UserRole };
        await this.updateUserProfile(user.uid, { role: 'super-admin' });
        return updatedProfile;
      }
      return existing;
    }

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'User',
      role: isAdminEmail ? 'super-admin' : 'client',
      photoURL: user.photoURL || undefined,
      createdAt: serverTimestamp() as unknown as { seconds: number; nanoseconds: number } | null
    };

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      return newProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      return newProfile;
    }
  },

  subscribeToAllUsers(callback: (users: UserProfile[]) => void) {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserProfile[];
      callback(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const docRef = doc(db, 'users', uid);
    try {
      return await updateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  },
  
  async deleteUserProfile(uid: string) {
    const docRef = doc(db, 'users', uid);
    try {
      return await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  },

  async signUp(email: string, pass: string, name: string) {
    const { user } = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(user, { displayName: name });
    return this.ensureUserProfile(user);
  },

  async login(email: string, pass: string) {
    const { user } = await signInWithEmailAndPassword(auth, email, pass);
    return this.ensureUserProfile(user);
  },

  async resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  },

  async logout() {
    return signOut(auth);
  }
};
