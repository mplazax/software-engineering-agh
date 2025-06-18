import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  isAuthenticated,
} from "../api/authService";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuthState = useCallback(async () => {
    if (isAuthenticated()) {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Auth check failed, logging out.", error);
        apiLogout();
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const login = async (email, password) => {
    await apiLogin(email, password);
    const userData = await getCurrentUser();
    setUser(userData);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
