import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const loadProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setProfile(data);
    } catch {}
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        loadProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }).catch(() => {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      displayName,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: { id: 'nutrimeth', public_settings: {} },
      authChecked,
      logout,
      navigateToLogin: () => {},
      checkUserAuth: async () => {},
      checkAppState: async () => {},
      refreshProfile: () => user && loadProfile(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
