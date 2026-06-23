import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AUTH_KEY = "clinicos_auth_v1";
const VALID_USER = "Marchello";
const VALID_PASS = "Kapoorz123$";

type AuthCtx = {
  isAuthed: boolean;
  user: string | null;
  login: (u: string, p: string) => boolean;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) setUser(raw);
  }, []);
  const login = (u: string, p: string) => {
    if (u === VALID_USER && p === VALID_PASS) {
      localStorage.setItem(AUTH_KEY, u);
      setUser(u);
      return true;
    }
    return false;
  };
  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };
  return <Ctx.Provider value={{ isAuthed: !!user, user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    if (!isAuthed) nav("/login", { replace: true, state: { from: loc.pathname } });
  }, [isAuthed, nav, loc.pathname]);
  if (!isAuthed) return null;
  return <>{children}</>;
}
