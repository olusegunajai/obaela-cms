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
  serverTimestamp,
  where,
  getDocs,
  limit
} from 'firebase/firestore';

export interface Page {
  id?: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const pageService = {
  async createPage(pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>) {
    const pagesRef = collection(db, 'pages');
    return addDoc(pagesRef, {
      ...pageData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async updatePage(pageId: string, pageData: Partial<Page>) {
    const pageRef = doc(db, 'pages', pageId);
    return updateDoc(pageRef, {
      ...pageData,
      updatedAt: serverTimestamp()
    });
  },

  async deletePage(pageId: string) {
    const pageRef = doc(db, 'pages', pageId);
    return deleteDoc(pageRef);
  },

  subscribeToPages(callback: (pages: Page[]) => void) {
    const q = query(collection(db, 'pages'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const pages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Page[];
      callback(pages);
    });
  },

  async getPageBySlug(slug: string): Promise<Page | null> {
    const q = query(
      collection(db, 'pages'), 
      where('slug', '==', slug), 
      where('isPublished', '==', true),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Page;
  }
};
