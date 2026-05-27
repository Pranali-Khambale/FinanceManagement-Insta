import { createContext, useContext, useState, useCallback, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(() => authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());
  const [isInitializing, setIsInitializing]   = useState(true);

  // On mount — verify the stored token is still valid against the server
  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsInitializing(false);
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://192.168.1.17:5000/api"}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.data.user);
          setIsAuthenticated(true);
        } else {
          // Token rejected by server — clear everything
          authService.logout();
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch {
        // Network error — keep the stored state, don't log out
      } finally {
        setIsInitializing(false);
      }
    };
    verify();
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.data.user);
    setIsAuthenticated(true);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};