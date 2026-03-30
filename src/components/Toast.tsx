import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

let toastCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = `toast-${toastCounter++}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`
                pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md
                ${toast.type === 'success' ? 'bg-emerald-50/90 border-emerald-100 text-emerald-800' : ''}
                ${toast.type === 'error' ? 'bg-rose-50/90 border-rose-100 text-rose-800' : ''}
                ${toast.type === 'info' ? 'bg-paper/90 border-black/5 text-forest' : ''}
              `}
            >
              {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-500" />}
              {toast.type === 'error' && <AlertCircle size={20} className="text-rose-500" />}
              {toast.type === 'info' && <Info size={20} className="text-gold" />}
              
              <p className="text-sm font-medium">{toast.message}</p>
              
              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-black/5 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
