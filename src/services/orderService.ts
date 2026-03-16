import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Order {
  id?: string;
  clientUid: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentReference: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export const orderService = {
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    const ordersRef = collection(db, 'orders');
    return addDoc(ordersRef, {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const orderRef = doc(db, 'orders', orderId);
    return updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });
  },

  subscribeToUserOrders(userId: string, callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, 'orders'),
      where('clientUid', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      callback(orders);
    });
  },

  subscribeToAllOrders(callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      callback(orders);
    });
  }
};
