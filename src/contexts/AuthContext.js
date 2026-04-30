import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { fetchUserSessionForUid } from '../services/appUsersAuth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setLoading(false);
      }
      return undefined;
    }

    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.removeItem('user');
        }
        setLoading(false);
        return;
      }

      try {
        const session = await fetchUserSessionForUid(firebaseUser.uid);
        if (session) {
          setUser(session);
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.setItem('user', JSON.stringify(session));
          }
        } else {
          setUser(null);
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.removeItem('user');
          }
          try {
            await firebaseSignOut(auth);
          } catch (signOutErr) {
            console.warn('[Auth] signOut after missing profile:', signOutErr);
          }
        }
      } catch (error) {
        console.error('[Auth] Failed to load user profile:', error);
        setUser(null);
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.removeItem('user');
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = (userData) => {
    setUser(userData);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    router.replace('/landing');
    setTimeout(async () => {
      try {
        if (auth) {
          await firebaseSignOut(auth);
        }
      } catch (error) {
        console.warn('[Auth] signOut:', error);
      }
      setUser(null);
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('user');
      }
    }, 100);
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
