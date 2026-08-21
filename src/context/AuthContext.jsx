import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import authService from "../services/authService";
import { BASE_URL } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());
  const [isInitializing, setIsInitializing] = useState(true);

  // Guards against React 18 StrictMode firing this effect twice in dev,
  // and against the request resolving after the component has unmounted.
  const hasVerifiedRef = useRef(false);

  const verifySession = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
    try {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const profile = data?.data?.user || data?.data || null;
        if (profile) {
          setUser(profile);
          localStorage.setItem("user", JSON.stringify(profile));
        }
        setIsAuthenticated(true);
        return true;
      }

      if (res.status === 401 || res.status === 403) {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      // Other server errors — keep existing local session
      setIsAuthenticated(true);
      return true;
    } catch {
      // Network error — keep existing local session
      return isAuthenticated;
    }
  }, [isAuthenticated]);

  // On mount — verify the stored token is still valid against the server
  useEffect(() => {
    if (hasVerifiedRef.current) return; // StrictMode double-invoke guard
    hasVerifiedRef.current = true;

    const controller = new AbortController();

    const verify = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsInitializing(false);
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          const profile = data?.data?.user || data?.data || null;
          if (profile) {
            setUser(profile);
            localStorage.setItem("user", JSON.stringify(profile));
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(true);
          }
        } else if (res.status === 401 || res.status === 403) {
          authService.logout();
          setIsAuthenticated(false);
          setUser(null);
        } else {
          setIsAuthenticated(true);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
      } finally {
        setIsInitializing(false);
      }
    };
    verify();

    return () => controller.abort();
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    // STEP 1 only — no session yet, OTP still pending. Don't touch auth state here.
    return data;
  }, []);

  // STEP 2 — completes login. Persists session via authService AND updates
  // context state so ProtectedRoute sees isAuthenticated=true immediately.
  const verifyOtp = useCallback(async ({ pendingToken, otp, rememberMe = false }) => {
    const data = await authService.verifyOtp({ pendingToken, otp, rememberMe });
    if (data.success) {
      setUser(data.data.user);
      setIsAuthenticated(true);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isInitializing, login, verifyOtp, logout, verifySession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};