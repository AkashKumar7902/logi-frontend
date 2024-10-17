// src/contexts/AuthContext.js
import React, { createContext, useState } from 'react';
import {jwtDecode} from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const tokenFromStorage = localStorage.getItem('token');
  const [authToken, setAuthToken] = useState(tokenFromStorage);

  const [userRole, setUserRole] = useState(() => {
    if (tokenFromStorage) {
      try {
        const decoded = jwtDecode(tokenFromStorage);
        return decoded.role;
      } catch (error) {
        console.error('Error decoding token on initialization:', error);
        return null;
      }
    } else {
      return null;
    }
  });

  const login = (token) => {
    localStorage.setItem('token', token);
    setAuthToken(token);
    try {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role);
    } catch (error) {
      console.error('Error decoding token during login:', error);
      setUserRole(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setUserRole(null);
  };

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
