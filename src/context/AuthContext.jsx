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
          // Handle either { data: { user: {...} } } or { data: {...} }
          const profile = data?.data?.user || data?.data || null;
          if (profile) {
            setUser(profile);
            localStorage.setItem("user", JSON.stringify(profile));
            setIsAuthenticated(true);
          } else {
            // Unexpected shape — keep existing stored user, don't log out
            setIsAuthenticated(true);
          }
        } else if (res.status === 401 || res.status === 403) {
          // Token genuinely rejected by server — clear everything
          authService.logout();
          setIsAuthenticated(false);
          setUser(null);
        } else {
          // Some other server error (404, 500, etc.) — don't log the user out,
          // just keep the locally stored session
          setIsAuthenticated(true);
        }
      } catch (err) {
        // Aborted on unmount — not a real error, ignore silently
        if (err.name === "AbortError") return;
        // Network error — keep the stored state, don't log out
      } finally {
        setIsInitializing(false);
      }
    };
    verify();

    return () => controller.abort();
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