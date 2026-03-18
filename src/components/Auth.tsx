import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

import { authService } from '../services/authService';

export const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await authService.ensureUserProfile(currentUser);
      }
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) return <div className="animate-pulse h-8 w-24 bg-gray-200 rounded-full"></div>;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-gold" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon size={20} className="text-forest" />
          )}
          <span className="text-sm font-medium hidden sm:inline">{user.displayName}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className="flex items-center gap-2 px-6 py-2.5 bg-forest text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-forest/20"
    >
      <LogIn size={18} />
      <span>Sign In</span>
    </button>
  );
};
