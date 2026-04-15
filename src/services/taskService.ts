import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  FieldValue
} from 'firebase/firestore';
import { db } from '../firebase';

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export interface Task {
  id?: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedTo?: string;
  createdAt: FieldValue;
  completedAt?: FieldValue;
}

const COLLECTION_NAME = 'tasks';

export const taskService = {
  async createTask(data: Omit<Task, 'id' | 'createdAt'>) {
    const newTask = {
      ...data,
      createdAt: serverTimestamp()
    };
    return await addDoc(collection(db, COLLECTION_NAME), newTask);
  },

  subscribeToTasks(callback: (tasks: Task[]) => void) {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      callback(tasks);
    }, (error) => {
      console.error("Error fetching tasks:", error);
    });
  },

  async updateTask(id: string, data: Partial<Task>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    if (data.status === TaskStatus.COMPLETED && !data.completedAt) {
      data.completedAt = serverTimestamp();
    }
    return await updateDoc(docRef, data);
  },

  async deleteTask(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await deleteDoc(docRef);
  }
};
