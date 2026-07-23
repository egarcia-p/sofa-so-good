// src/context/AppContext.jsx
import { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCollection } from '../hooks/useCollection';
import { useToast } from '../hooks/useToast';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const auth = useAuth();
  const collection = useCollection(auth.profile?.householdId);
  const toast = useToast();

  return (
    <AppContext.Provider value={{ auth, collection, toast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
