"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  userId: string | null;
  username: string | null;
  login: (userId: string, username: string) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  showAuthModal: (view?: 'login' | 'register') => void;
  hideAuthModal: () => void;
  authView: 'login' | 'register';
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  username: null,
  login: () => {},
  logout: () => {},
  isAuthModalOpen: false,
  showAuthModal: () => {},
  hideAuthModal: () => {},
  authView: 'login',
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const router = useRouter();

  const showAuthModal = (view: 'login' | 'register' = 'login') => {
    setAuthView(view);
    setIsAuthModalOpen(true);
  };

  const hideAuthModal = () => setIsAuthModalOpen(false);

  useEffect(() => {
    // Load from local storage on mount
    const storedUserId = localStorage.getItem('user_id');
    const storedUsername = localStorage.getItem('username');
    if (storedUserId) {
      setUserId(storedUserId);
      setUsername(storedUsername);
    }
  }, []);

  const login = (id: string, name: string) => {
    setUserId(id);
    setUsername(name);
    localStorage.setItem('user_id', id);
    localStorage.setItem('username', name);
    setIsAuthModalOpen(false);
    window.location.reload();
  };

  const logout = () => {
    setUserId(null);
    setUsername(null);
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ userId, username, login, logout, isAuthModalOpen, showAuthModal, hideAuthModal, authView }}>
      {children}
    </AuthContext.Provider>
  );
};
