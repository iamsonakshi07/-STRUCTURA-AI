import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = {
      id,
      title: toast.title || 'Notification',
      message: toast.message || '',
      type: toast.type || 'info', // 'success' | 'warning' | 'error' | 'info'
      duration: toast.duration || 4500,
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, newToast.duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4">
        <AnimatePresence>
          {toasts.map((toast) => {
            const icons = {
              success: <CheckCircle2 className="w-5 h-5 text-healthy flex-shrink-0" />,
              warning: <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />,
              error: <AlertCircle className="w-5 h-5 text-critical flex-shrink-0" />,
              info: <Info className="w-5 h-5 text-cyan flex-shrink-0" />,
            };

            const borderColors = {
              success: 'border-healthy/40 shadow-green-glow',
              warning: 'border-warning/40 shadow-orange-glow',
              error: 'border-critical/40 shadow-red-glow',
              info: 'border-cyan/40 shadow-cyan-glow',
            };

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-navy-800/95 backdrop-blur-md border ${borderColors[toast.type]} shadow-xl`}
              >
                {icons[toast.type]}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-soft-white">{toast.title}</h4>
                  {toast.message && (
                    <p className="text-xs text-soft-muted mt-0.5 leading-relaxed">{toast.message}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-soft-subtle hover:text-soft-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
