import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmContextType {
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-black/5"
            >
              <h3 className="text-2xl font-bold mb-4 text-forest">{confirmConfig.title}</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">{confirmConfig.message}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 px-6 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmConfig.onConfirm}
                  className="flex-1 py-3 px-6 rounded-xl bg-forest text-white font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-forest/20"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
