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

export interface Lesson {
  id?: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string;
  order: number;
  createdAt: unknown;
}

export interface Course {
  id?: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  thumbnailUrl?: string;
  createdAt: unknown;
}

export const courseService = {
  // Course CRUD
  async createCourse(courseData: Omit<Course, 'id' | 'createdAt'>) {
    const coursesRef = collection(db, 'courses');
    return addDoc(coursesRef, {
      ...courseData,
      createdAt: serverTimestamp()
    });
  },

  async updateCourse(courseId: string, courseData: Partial<Course>) {
    const courseRef = doc(db, 'courses', courseId);
    return updateDoc(courseRef, {
      ...courseData,
      updatedAt: serverTimestamp()
    });
  },

  async deleteCourse(courseId: string) {
    const courseRef = doc(db, 'courses', courseId);
    return deleteDoc(courseRef);
  },

  subscribeToCourses(callback: (courses: Course[]) => void) {
    const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
      callback(courses);
    });
  },

  // Lesson CRUD
  async addLesson(courseId: string, lessonData: Omit<Lesson, 'id' | 'courseId' | 'createdAt'>) {
    const lessonsRef = collection(db, `courses/${courseId}/lessons`);
    return addDoc(lessonsRef, {
      ...lessonData,
      courseId,
      createdAt: serverTimestamp()
    });
  },

  async updateLesson(courseId: string, lessonId: string, lessonData: Partial<Lesson>) {
    const lessonRef = doc(db, `courses/${courseId}/lessons`, lessonId);
    return updateDoc(lessonRef, {
      ...lessonData,
      updatedAt: serverTimestamp()
    });
  },

  async deleteLesson(courseId: string, lessonId: string) {
    const lessonRef = doc(db, `courses/${courseId}/lessons`, lessonId);
    return deleteDoc(lessonRef);
  },

  subscribeToLessons(courseId: string, callback: (lessons: Lesson[]) => void) {
    const q = query(collection(db, `courses/${courseId}/lessons`), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const lessons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lesson[];
      callback(lessons);
    });
  }
};
