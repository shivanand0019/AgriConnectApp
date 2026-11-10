import React, { createContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser, sendOtp as sendOtpService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('agriconnect_token');
      if (token) {
        try {
          const res = await getCurrentUser();
          if (res.success) {
            setUser(res.data.user);
          }
        } catch (error) {
          console.error('Session expired or invalid token:', error.message);
          localStorage.removeItem('agriconnect_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    if (res.success) {
      localStorage.setItem('agriconnect_token', res.data.token);
      setUser(res.data);
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    if (res.success) {
      localStorage.setItem('agriconnect_token', res.data.token);
      setUser(res.data);
      return res.data;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const sendOtp = async (email) => {
    const res = await sendOtpService(email);
    if (res.success) {
      return res;
    }
    throw new Error(res.message || 'Failed to send OTP');
  };

  const logout = () => {
    localStorage.removeItem('agriconnect_token');
    setUser(null);
  };

  // Quick Switch helper for testing multiple roles instantly
  const switchDemoRole = async (roleEmail) => {
    return login({ email: roleEmail, password: 'password123' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        sendOtp,
        logout,
        switchDemoRole,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
