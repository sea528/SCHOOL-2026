import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  show: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, show }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const styles = type === 'success' 
    ? "bg-success-bg text-success-text border-success-text/10" 
    : "bg-error-bg text-error-text border-error-text/10";
  
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div 
      role="status"
      aria-live={type === 'success' ? 'polite' : 'assertive'}
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[360px] z-50 flex items-center p-4 rounded-[8px] shadow-lg border ${styles}`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="text-[15px] font-medium">{message}</span>
    </div>
  );
};