import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';
import { 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Mail, 
  Lock, 
  X, 
  Loader2, 
  ShieldCheck,
  UserPlus,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

export const Auth = () => {
  const { user, userProfile, loading } = useAuth();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setIsModalOpen(false);
      showToast("Signed in successfully!", "success");
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error("Login failed:", error);
      showToast("Login failed. Please try again.", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await authService.login(formData.email, formData.password);
        showToast("Welcome back!", "success");
      } else if (mode === 'signup') {
        await authService.signUp(formData.email, formData.password, formData.name);
        showToast("Account created successfully!", "success");
      } else if (mode === 'forgot') {
        await authService.resetPassword(formData.email);
        showToast("Password reset email sent!", "success");
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Authentication failed";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      showToast("Signed out successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Logout failed", "error");
    }
  };

  if (loading) return <div className="animate-pulse h-10 w-32 bg-gray-100 rounded-xl"></div>;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-forest/5 px-3 py-1.5 rounded-full border border-forest/10">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded-full border border-gold" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-forest text-white flex items-center justify-center text-[10px] font-bold">
              {user.displayName?.charAt(0) || <UserIcon size={12} />}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold leading-none">{user.displayName}</span>
            <span className="text-[8px] opacity-50 uppercase tracking-widest">{userProfile?.role}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-6 py-2.5 bg-forest text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-forest/20"
      >
        <LogIn size={18} />
        <span>Sign In</span>
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8 sm:p-12">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-forest/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {mode === 'login' ? <ShieldCheck className="text-forest w-8 h-8" /> : 
                     mode === 'signup' ? <UserPlus className="text-forest w-8 h-8" /> : 
                     <KeyRound className="text-forest w-8 h-8" />}
                  </div>
                  <h2 className="text-3xl font-bold serif">
                    {mode === 'login' ? 'Welcome Back' : 
                     mode === 'signup' ? 'Create Account' : 
                     'Reset Password'}
                  </h2>
                  <p className="text-sm opacity-50 mt-2">
                    {mode === 'login' ? 'Access your sacred knowledge' : 
                     mode === 'signup' ? 'Join our spiritual community' : 
                     'We\'ll send you a recovery link'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Full Name" 
                        required
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-forest outline-none transition-all"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-forest outline-none transition-all"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  {mode !== 'forgot' && (
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="password" 
                        placeholder="Password" 
                        required
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-forest outline-none transition-all"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  )}

                  {mode === 'login' && (
                    <div className="text-right">
                      <button 
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs font-bold text-forest hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-forest text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-xl shadow-forest/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 
                     mode === 'login' ? 'Sign In' : 
                     mode === 'signup' ? 'Create Account' : 
                     'Send Reset Link'}
                  </button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400">
                    <span className="bg-white px-4">Or continue with</span>
                  </div>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  className="w-full py-4 bg-white border border-gray-100 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  <span>Google Account</span>
                </button>

                <div className="mt-8 text-center text-sm">
                  {mode === 'login' ? (
                    <p className="opacity-50">
                      Don't have an account? {' '}
                      <button onClick={() => setMode('signup')} className="text-forest font-bold hover:underline">Sign Up</button>
                    </p>
                  ) : (
                    <p className="opacity-50">
                      Already have an account? {' '}
                      <button onClick={() => setMode('login')} className="text-forest font-bold hover:underline">Sign In</button>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
