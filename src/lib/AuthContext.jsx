import React, { createContext, useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, setCreatorContext } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Static values — never change
  const [isLoadingPublicSettings] = useState(false);
  const [authError] = useState(null);
  const [appPublicSettings] = useState({ id: 'nutrimeth', public_settings: {} });

  // Track current user ID via ref to avoid stale closures
  const userIdRef = useRef(null);
  // Guard against concurrent profile fetches
  const fetchingRef = useRef(false);
  // Prevent double-init (StrictMode double-invoke guard)
  const initDoneRef = useRef(false);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) {
        setProfile(data);
        setCreatorContext({ id: data.id, name: data.full_name, email: data.email });
      }
      return data;
    } catch {
      return null;
    }
  }, []); // stable — no deps that change

  // ensureProfile: upserts profile row if missing, then loads it
  const ensureProfile = useCallback(async (authUser) => {
    if (!authUser) return null;
    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.email?.split('@')[0] ||
      'User';
    try {
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();
      if (!existing) {
        await supabase.from('user_profiles').insert([{
          id: authUser.id,
          email: authUser.email,
          full_name: fullName,
          avatar_url: authUser.user_metadata?.avatar_url || null,
        }]);
      }
    } catch {
      // profile may already exist via DB trigger — ignore
    }
    return fetchProfile(authUser.id);
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const handleUser = async (authUser) => {
      if (!mounted || fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        setUser(authUser);
        setIsAuthenticated(true);
        userIdRef.current = authUser.id;
        await ensureProfile(authUser);
      } finally {
        if (mounted) fetchingRef.current = false;
      }
    };

    const handleSignOut = () => {
      if (!mounted) return;
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      userIdRef.current = null;
      fetchingRef.current = false;
      setCreatorContext({ id: null, name: null, email: null });
    };

    // Initial session check — runs ONCE
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        await handleUser(session.user);
      } else {
        handleSignOut();
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }).catch(() => {
      if (!mounted) return;
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    // Auth state listener
    // - Ignores TOKEN_REFRESHED to prevent re-render loops from token auto-refresh
    // - Only handles actual sign-in/out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      // Skip token refreshes entirely — they don't need UI updates
      if (event === 'TOKEN_REFRESHED') return;
      // Skip INITIAL_SESSION — handled by getSession() above
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_IN' && session?.user) {
        // Only re-process if this is actually a different user session
        if (session.user.id !== userIdRef.current) {
          await handleUser(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        handleSignOut();
      } else if (event === 'USER_UPDATED' && session?.user) {
        // Just update the user object, don't re-fetch profile
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // empty deps — run once on mount only

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    userIdRef.current = null;
    fetchingRef.current = false;
    setCreatorContext({ id: null, name: null, email: null });
  }, []);

  // checkUserAuth: used for manual re-auth checks — kept stable
  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.id !== userIdRef.current) {
        setUser(session.user);
        setIsAuthenticated(true);
        userIdRef.current = session.user.id;
        await ensureProfile(session.user);
      } else if (!session) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        userIdRef.current = null;
      }
    } catch {}
    setIsLoadingAuth(false);
    setAuthChecked(true);
  }, [ensureProfile]);

  const checkAppState = useCallback(async () => { await checkUserAuth(); }, [checkUserAuth]);
  const navigateToLogin = useCallback(() => {}, []);

  const displayName = profile?.full_name
    || user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'User';

  // Memoize so consumers only re-render when relevant state actually changes
  const value = useMemo(() => ({
    user, profile, displayName, isAuthenticated, isLoadingAuth,
    isLoadingPublicSettings, authError, appPublicSettings, authChecked,
    logout, navigateToLogin, checkUserAuth, checkAppState, fetchProfile, ensureProfile,
  }), [
    user, profile, displayName, isAuthenticated, isLoadingAuth, authChecked,
    logout, checkUserAuth, checkAppState, fetchProfile, ensureProfile,
    isLoadingPublicSettings, authError, appPublicSettings, navigateToLogin,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
