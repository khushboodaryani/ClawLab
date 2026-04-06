"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (provider: "google" | "github") => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for session on mount
  useEffect(() => {
    // Check for OAuth errors in URL
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      console.error("OAuth error:", error);
      alert(`Authentication failed: ${error}. Please check your configuration.`);
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:8082/api/auth/me", {credentials: "include"});
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setUser(data);
            localStorage.setItem("clawlab_user", JSON.stringify(data));
          } else {
            setUser(null);
            localStorage.removeItem("clawlab_user");
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = (provider: "google" | "github") => {
    window.location.href = `http://localhost:8082/api/auth/${provider}/login`;
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:8082/api/auth/logout", {credentials: "include"});
      localStorage.removeItem("clawlab_user");
      setUser(null);
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
