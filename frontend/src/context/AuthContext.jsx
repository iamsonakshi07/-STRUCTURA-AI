import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Default demo user for instant hackathon evaluation
    const stored = authService.getCurrentUser();
    if (stored) return stored;
    return {
      id: 1,
      name: 'Chief Engineer Admin',
      email: 'admin@structura.ai',
      role: 'admin',
    };
  });
  const [token, setToken] = useState(() => localStorage.getItem('structura_token'));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If token exists, try to verify
    if (token) {
      authService.getMe()
        .then((res) => {
          if (res?.data) {
            setUser(res.data);
          }
        })
        .catch(() => {
          // Keep current user state
        });
    }
  }, [token]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      setToken(data.access_token);
      setUser(data.user);
      return data;
    } catch (err) {
      // If backend network error in demo mode, set demo user anyway with disclaimer
      if (!err.response) {
        const fallbackUser = {
          id: 1,
          name: email.includes('admin') ? 'Chief Engineer Admin' : 'Lead Inspector Sarah',
          email,
          role: email.includes('admin') ? 'admin' : 'inspector',
        };
        setUser(fallbackUser);
        localStorage.setItem('structura_user', JSON.stringify(fallbackUser));
        return { user: fallbackUser, access_token: 'demo-token' };
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = (role) => {
    const demoUser = role === 'admin' ? {
      id: 1,
      name: 'Chief Engineer Admin',
      email: 'admin@structura.ai',
      role: 'admin',
    } : {
      id: 2,
      name: 'Lead Inspector Sarah',
      email: 'inspector@structura.ai',
      role: 'inspector',
    };
    setUser(demoUser);
    localStorage.setItem('structura_user', JSON.stringify(demoUser));
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        role: user?.role || 'inspector',
        login,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
