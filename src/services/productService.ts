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

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  featured?: boolean;
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

  async updateProduct(id: string, data: Partial<Product>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(docRef, data);
  },

  async deleteProduct(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await deleteDoc(docRef);
  }
};
