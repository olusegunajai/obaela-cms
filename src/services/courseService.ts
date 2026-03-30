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
  setDoc
} from 'firebase/firestore';

export interface Lesson {
  id?: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string;
  audioUrl?: string;
  requiredLevel?: number; // 0: public, 1: client, 2: admin
  order: number;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export interface Course {
  id?: string;
  title: string;
  description: string;
  category?: string;
  instructor: string;
  price: number;
  thumbnailUrl?: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export interface Enrollment {
  courseId: string;
  enrolledAt: { seconds: number; nanoseconds: number } | null;
  progress: number;
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
  },

  // Enrollment
  async enrollInCourse(userId: string, courseId: string) {
    const enrollmentRef = doc(db, `users/${userId}/enrollments`, courseId);
    return setDoc(enrollmentRef, {
      courseId,
      enrolledAt: serverTimestamp(),
      progress: 0
    });
  },

  async checkEnrollment(userId: string, courseId: string) {
    const q = query(collection(db, `users/${userId}/enrollments`), where('courseId', '==', courseId));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },

  subscribeToEnrollments(userId: string, callback: (enrollments: Enrollment[]) => void) {
    const q = query(collection(db, `users/${userId}/enrollments`));
    return onSnapshot(q, (snapshot) => {
      const enrollments = snapshot.docs.map(doc => doc.data()) as Enrollment[];
      callback(enrollments);
    });
  },

  async completeLesson(userId: string, courseId: string, lessonId: string) {
    const completionRef = doc(db, `users/${userId}/enrollments/${courseId}/completions`, lessonId);
    return setDoc(completionRef, {
      lessonId,
      completedAt: serverTimestamp()
    });
  },

  subscribeToCompletions(userId: string, courseId: string, callback: (completions: string[]) => void) {
    const q = query(collection(db, `users/${userId}/enrollments/${courseId}/completions`));
    return onSnapshot(q, (snapshot) => {
      const completions = snapshot.docs.map(doc => doc.id);
      callback(completions);
    });
  }
};
