// src/hooks/useToast.js
import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  const success = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg) => showToast(msg, 'error'), [showToast]);
  const info = useCallback((msg) => showToast(msg, 'info'), [showToast]);

  return { toast, showToast, success, error, info };
}
