import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, AuthResponse } from '../types/auth';
import { fetchApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<UserRole>;
  register: (userData: any) => Promise<UserRole>;
  logout: (reason?: string) => void;
  getRoleDashboardPath: (role: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('eduspark_user');
      return savedUser && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('eduspark_token');
    return savedToken && savedToken !== 'undefined' && savedToken !== 'null' ? savedToken : null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getRoleDashboardPath = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'teacher':
        return '/teacher';
      case 'parent':
        return '/parent';
      case 'student':
        return '/student';
      default:
        return '/login';
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      const currentToken = localStorage.getItem('eduspark_token');
      if (currentToken && currentToken !== 'undefined' && currentToken !== 'null') {
        try {
          console.log('[AuthContext:checkAuth] Validating existing session token with /auth/me');
          const res = await fetchApi<{ success: boolean; user: User }>('/auth/me');
          if (!isMounted) return;
          if (res.success && res.user) {
            console.log('[AuthContext:checkAuth] Session valid for user:', res.user.email);
            setUser(res.user);
            setToken(currentToken);
            localStorage.setItem('eduspark_user', JSON.stringify(res.user));
          } else {
            console.warn('[AuthContext:checkAuth] /auth/me did not return user:', res);
          }
        } catch (err: any) {
          if (!isMounted) return;
          console.warn('[AuthContext:checkAuth] Token validation notice:', err.message || err);
          // Only clear token if server explicitly rejected authentication with invalid/expired token error
          if (err.message && (err.message.includes('Token missing') || err.message.includes('Invalid token') || err.message.includes('not authorized') || err.message.includes('User no longer exists'))) {
            console.warn('[AuthContext:checkAuth] Server rejected token with 401, clearing session.');
            logout('checkAuth failed with 401 unauthenticated: ' + err.message);
          }
        }
      } else {
        if (!isMounted) return;
        setToken(null);
        setUser(null);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string, role?: UserRole): Promise<UserRole> => {
    console.log('[AuthContext:login] Calling POST /auth/login for:', { email, role });
    const res = await fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });

    console.log('[AuthContext:login] Response received:', {
      success: res.success,
      hasToken: Boolean(res.token),
      user: res.user ? { id: res.user.id, email: res.user.email, role: res.user.role } : null,
    });

    if (res.success && res.token && res.user) {
      localStorage.setItem('eduspark_token', res.token);
      localStorage.setItem('eduspark_user', JSON.stringify(res.user));
      console.log('[AuthContext:login] Successfully stored eduspark_token in localStorage:', {
        tokenStored: Boolean(localStorage.getItem('eduspark_token')),
        userStored: Boolean(localStorage.getItem('eduspark_user')),
      });
      setToken(res.token);
      setUser(res.user);
      return res.user.role;
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const register = async (userData: any): Promise<UserRole> => {
    console.log('[AuthContext:register] Calling POST /auth/register');
    const res = await fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (res.success && res.token && res.user) {
      localStorage.setItem('eduspark_token', res.token);
      localStorage.setItem('eduspark_user', JSON.stringify(res.user));
      console.log('[AuthContext:register] Successfully stored eduspark_token in localStorage');
      setToken(res.token);
      setUser(res.user);
      return res.user.role;
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  };

  const logout = (reason?: string) => {
    const triggerReason = typeof reason === 'string' ? reason : 'Explicit UI Logout action';
    console.warn('[AuthContext:logout] Logging out and removing eduspark_token from localStorage.');
    console.warn('[AuthContext:logout] Trigger reason:', triggerReason);
    console.trace('[AuthContext:logout] Call trace:');
    console.log('[AuthContext:logout] Current auth state before clearing:', {
      hasUser: Boolean(user),
      userEmail: user?.email,
      hasToken: Boolean(token),
      hasStoredToken: Boolean(localStorage.getItem('eduspark_token')),
    });
    localStorage.removeItem('eduspark_token');
    localStorage.removeItem('eduspark_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        getRoleDashboardPath,
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
