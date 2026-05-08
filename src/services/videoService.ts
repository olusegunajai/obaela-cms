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
  requiredLevel?: number; // 0: public, 1: client, 2: admin
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export const videoService = {
  getYouTubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  },

  getThumbnailUrl(videoId: string) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  },

  async addVideo(videoData: Omit<YouTubeVideo, 'id' | 'createdAt'>) {
    const youtubeId = this.getYouTubeId(videoData.youtubeId);
    const thumbnailUrl = videoData.thumbnailUrl || this.getThumbnailUrl(youtubeId);
    
    const videosRef = collection(db, 'videos');
    return addDoc(videosRef, {
      ...videoData,
      youtubeId,
      thumbnailUrl,
      createdAt: serverTimestamp()
    });
  },

  async updateVideo(videoId: string, videoData: Partial<YouTubeVideo>) {
    const updateData = { ...videoData };
    if (videoData.youtubeId) {
      const youtubeId = this.getYouTubeId(videoData.youtubeId);
      updateData.youtubeId = youtubeId;
      if (!videoData.thumbnailUrl) {
        updateData.thumbnailUrl = this.getThumbnailUrl(youtubeId);
      }
    }

    const videoRef = doc(db, 'videos', videoId);
    return updateDoc(videoRef, {
      ...updateData,
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
