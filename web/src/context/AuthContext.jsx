import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS } from '../data/mockData';
import { AuthService } from '../services/api';
import wsService from '../services/websocketService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('pulseroute_user');
    return saved ? JSON.parse(saved) : DEMO_USERS.admin; // Default to Admin for full demo visibility
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('pulseroute_token') || null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pulseroute_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pulseroute_user');
    }
  }, [currentUser]);

  // Synchronize signed JWT token with backend for currentUser role (Milestone 9.1)
  useEffect(() => {
    let isMounted = true;
    const syncToken = async () => {
      if (!currentUser?.role) return;
      try {
        const tokenRes = await AuthService.getDemoToken(currentUser.role.toLowerCase());
        if (isMounted && tokenRes?.access_token) {
          setToken(tokenRes.access_token);
          localStorage.setItem('pulseroute_token', tokenRes.access_token);
          wsService.setToken(tokenRes.access_token);
        }
      } catch (err) {
        console.warn('Could not sync JWT token with backend, running offline:', err);
      }
    };

    syncToken();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const login = async (credentialsOrRole = 'admin') => {
    // 1. If object with email & password, perform real credential login
    if (typeof credentialsOrRole === 'object' && credentialsOrRole?.email && credentialsOrRole?.password) {
      const authRes = await AuthService.login(credentialsOrRole);
      const user = authRes.user || {
        id: authRes.user_id,
        name: authRes.user?.full_name || authRes.user_id,
        email: credentialsOrRole.email,
        role: authRes.role,
      };
      setCurrentUser(user);
      if (authRes.access_token) {
        setToken(authRes.access_token);
        localStorage.setItem('pulseroute_token', authRes.access_token);
        wsService.setToken(authRes.access_token);
      }
      return user;
    }

    // 2. Demo role-based login
    const roleKey = typeof credentialsOrRole === 'string' ? credentialsOrRole : 'admin';
    const targetUser = DEMO_USERS[roleKey.toLowerCase()] || DEMO_USERS.reporter;
    setCurrentUser(targetUser);
    try {
      const tokenRes = await AuthService.getDemoToken(targetUser.role.toLowerCase());
      if (tokenRes?.access_token) {
        setToken(tokenRes.access_token);
        localStorage.setItem('pulseroute_token', tokenRes.access_token);
        wsService.setToken(tokenRes.access_token);
      }
    } catch (e) {
      const mock = `mock-token-${targetUser.role.toLowerCase()}-${Date.now()}`;
      setToken(mock);
      localStorage.setItem('pulseroute_token', mock);
    }
    return targetUser;
  };

  const switchRole = (newRole) => {
    const upper = (newRole || '').toUpperCase();
    const roleMap = {
      REPORTER: DEMO_USERS.reporter,
      PATIENT: DEMO_USERS.reporter,
      DISPATCHER: DEMO_USERS.dispatcher,
      DRIVER: DEMO_USERS.driver,
      HOSPITAL: DEMO_USERS.hospital,
      ADMIN: DEMO_USERS.admin,
    };
    const selected = roleMap[upper] || DEMO_USERS.reporter;
    setCurrentUser(selected);
    return selected;
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch {
      // Ignore network errors during logout cleanup
    }
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('pulseroute_user');
    localStorage.removeItem('pulseroute_token');
    wsService.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'GUEST',
        isAuthenticated: !!currentUser,
        login,
        logout,
        switchRole,
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
