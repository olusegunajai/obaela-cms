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

export interface YouTubeVideo {
  id?: string;
  title: string;
  description: string;
  youtubeId: string;
  thumbnailUrl?: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export const videoService = {
  async addVideo(videoData: Omit<YouTubeVideo, 'id' | 'createdAt'>) {
    const videosRef = collection(db, 'videos');
    return addDoc(videosRef, {
      ...videoData,
      createdAt: serverTimestamp()
    });
  },

  async updateVideo(videoId: string, videoData: Partial<YouTubeVideo>) {
    const videoRef = doc(db, 'videos', videoId);
    return updateDoc(videoRef, {
      ...videoData,
      updatedAt: serverTimestamp()
    });
  },

  async deleteVideo(videoId: string) {
    const videoRef = doc(db, 'videos', videoId);
    return deleteDoc(videoRef);
  },

  subscribeToVideos(callback: (videos: YouTubeVideo[]) => void) {
    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const videos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as YouTubeVideo[];
      callback(videos);
    });
  }
};
