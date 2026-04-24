// src/contexts/AuthContext.js
import React, { createContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AUTH_EXPIRED_EVENT } from '../services/api';

export const AuthContext = createContext();

const readValidStoredAuth = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { token: null, role: null };
  }

  try {
    const decoded = jwtDecode(token);
    if (!decoded?.role || !decoded?.exp || decoded.exp * 1000 <= Date.now()) {
      localStorage.removeItem('token');
      return { token: null, role: null };
    }
    return { token, role: decoded.role };
  } catch (error) {
    localStorage.removeItem('token');
    return { token: null, role: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(readValidStoredAuth);
  const { token: authToken, role: userRole } = authState;

  const login = (token) => {
    try {
      const decoded = jwtDecode(token);
      if (!decoded?.role || !decoded?.exp || decoded.exp * 1000 <= Date.now()) {
        throw new Error('Invalid token');
      }
      localStorage.setItem('token', token);
      setAuthState({ token, role: decoded.role });
    } catch (error) {
      localStorage.removeItem('token');
      setAuthState({ token: null, role: null });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({ token: null, role: null });
  };

  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, logout);
  }, []);

  const isAuthenticated = !!authToken;

  return (
    <AuthContext.Provider
      value={{ authToken, isAuthenticated, userRole, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
