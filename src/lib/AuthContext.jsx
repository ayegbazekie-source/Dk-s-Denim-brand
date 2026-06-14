import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // 1. Fetch initial active user session when the application mounts
    const initializeAuth = async () => {
      try {
        setIsLoadingAuth(true);
        setAuthError(null);

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('User auth check failed:', error);
        setAuthError({
          type: 'auth_error',
          message: error.message || 'Authentication check failed'
        });
        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    };

    initializeAuth();

    // 2. Set up a real-time listener for any authorization state updates (Sign In, Sign Out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    // Cleanup subscription on unmount
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Log out function utilizing Supabase native routines
  const logout = async () => {
    try {
      setIsLoadingAuth(true);
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      authError,
      authChecked,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
