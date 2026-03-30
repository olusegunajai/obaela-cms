import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy,
  serverTimestamp,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Review {
  id?: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: Timestamp | FieldValue | null;
}

export const reviewService = {
  async addReview(productId: string, review: Omit<Review, 'id' | 'createdAt'>) {
    const reviewsRef = collection(db, 'products', productId, 'reviews');
    return await addDoc(reviewsRef, {
      ...review,
      createdAt: serverTimestamp()
    });
  },

  subscribeToReviews(productId: string, callback: (reviews: Review[]) => void) {
    const reviewsRef = collection(db, 'products', productId, 'reviews');
    const q = query(reviewsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      callback(reviews);
    }, (error) => {
      console.error("Error fetching reviews:", error);
    });
  }
};
