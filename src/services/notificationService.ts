import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  deleteDoc,
  getDocs,
  limit
} from 'firebase/firestore';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'booking' | 'payment' | 'update';

export interface Notification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: { seconds: number; nanoseconds: number } | null;
  link?: string;
}

export const notificationService = {
  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    try {
      return await addDoc(collection(db, 'notifications'), {
        ...notification,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  async sendToAllAdmins(notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'>) {
    try {
      const adminQuery = query(collection(db, 'users'), where('role', 'in', ['admin', 'super-admin']));
      const adminSnap = await getDocs(adminQuery);
      
      const promises = adminSnap.docs.map(adminDoc => 
        this.sendNotification({
          ...notification,
          userId: adminDoc.id
        })
      );
      
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error sending notification to admins:', error);
      throw error;
    }
  },

  async sendToAllUsers(notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'>) {
    try {
      const userSnap = await getDocs(collection(db, 'users'));
      
      const promises = userSnap.docs.map(userDoc => 
        this.sendNotification({
          ...notification,
          userId: userDoc.id
        })
      );
      
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error sending notification to all users:', error);
      throw error;
    }
  },

  subscribeToUserNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      callback(notifications);
    });
  },

  async markAsRead(notificationId: string) {
    const docRef = doc(db, 'notifications', notificationId);
    return updateDoc(docRef, { read: true });
  },

  async markAllAsRead(userId: string) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(d => this.markAsRead(d.id));
    return Promise.all(promises);
  },

  async deleteNotification(notificationId: string) {
    const docRef = doc(db, 'notifications', notificationId);
    return deleteDoc(docRef);
  }
};
