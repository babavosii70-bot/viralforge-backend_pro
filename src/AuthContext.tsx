import React, { createContext, useContext, useEffect, useState } from "react";
import { API_URL } from "./constants";

interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, role?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("forge_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("forge_token");
    const savedUser = localStorage.getItem("forge_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("forge_token", data.token);
    localStorage.setItem("forge_user", JSON.stringify(data.user));
  };

  const register = async (email: string, pass: string, role = "USER") => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass, role })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("forge_token");
    localStorage.removeItem("forge_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
