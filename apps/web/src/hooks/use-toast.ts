'use client';

import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastId = 0;

// Simple toast implementation - in a real app you'd use a proper toast library
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = (toastId++).toString();
    
    // For now, just use browser alerts for simplicity
    if (variant === 'destructive') {
      alert(`Error: ${title}\n${description}`);
    } else {
      alert(`${title}\n${description}`);
    }
    
    // In a real implementation, you'd add to toast state and handle display
    const newToast: Toast = { id, title, description, variant };
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  return { toast, toasts };
};

export const toast = ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
  // For now, just use browser alerts for simplicity
  if (variant === 'destructive') {
    alert(`Error: ${title}\n${description}`);
  } else {
    alert(`${title}\n${description}`);
  }
};