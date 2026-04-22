import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  limit,
  startAfter,
  getDocs,
  where,
  QueryDocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  featured?: boolean;
  features?: string[];
  specifications?: Record<string, string>;
  usageInstructions?: string;
  createdAt: string;
}

const COLLECTION_NAME = 'products';

export const productService = {
  async createProduct(data: Omit<Product, 'id' | 'createdAt'>) {
    const newProduct: Omit<Product, 'id'> = {
      ...data,
      createdAt: new Date().toISOString()
    };
    return await addDoc(collection(db, COLLECTION_NAME), newProduct);
  },

  subscribeToProducts(callback: (products: Product[]) => void) {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      callback(products);
    }, (error) => {
      console.error("Error fetching products:", error);
    });
  },

  async getProducts(pageSize: number, lastVisibleDoc?: QueryDocumentSnapshot, category?: string, featuredOnly?: boolean) {
    const constraints: QueryConstraint[] = [];
    
    if (category && category !== 'All') {
      constraints.push(where('category', '==', category));
    }

    if (featuredOnly) {
      constraints.push(where('featured', '==', true));
    }

    // Only order by createdAt if no category/featured filter is applied, 
    // unless we have composite indexes. Without indexes, mixed filters + orderBy fail.
    if (!category || category === 'All') {
      constraints.push(orderBy('createdAt', 'desc'));
    }

    if (lastVisibleDoc) {
      constraints.push(startAfter(lastVisibleDoc));
    }

    constraints.push(limit(pageSize));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    
    return {
      products,
      lastVisible: snapshot.docs[snapshot.docs.length - 1]
    };
  },

  async getAllCategories() {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    const categories = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.category) categories.add(data.category);
    });
    return Array.from(categories);
  },

  async updateProduct(id: string, data: Partial<Product>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(docRef, data);
  },

  async deleteProduct(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await deleteDoc(docRef);
  }
};
