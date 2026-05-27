// src/context/PendingCountContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import employeeService from '../services/employeeService';

const PendingCountContext = createContext({
  pendingCount: 0,
  refreshPendingCount: () => {},
});

export const PendingCountProvider = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const refreshPendingCount = useCallback(async () => {
    try {
      const res = await employeeService.getPendingCount();
      if (res.success) setPendingCount(res.count ?? 0);
    } catch {
      // Non-critical — badge stays at its previous value on network error
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingCount(0); // clear badge on logout
      return;
    }

    refreshPendingCount();
    const id = setInterval(refreshPendingCount, 60_000);
    return () => clearInterval(id);
  }, [isAuthenticated, refreshPendingCount]);

  return (
    <PendingCountContext.Provider value={{ pendingCount, refreshPendingCount }}>
      {children}
    </PendingCountContext.Provider>
  );
};

export const usePendingCount = () => useContext(PendingCountContext);

export default PendingCountContext;