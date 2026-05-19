import React, { createContext, useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, setCreatorContext } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const [isLoadingPublicSettings] = useState(false);
  const [authError] = useState(null);
  const [appPublicSettings] = useState({ id: 'nutrimeth', public_settings: {} });

  const userIdRef = useRef(null);
  const loadingDoneRef = useRef(false); // guard so setLoadingDone only fires once

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
  }, []);

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
    } catch {}
    return fetchProfile(authUser.id);
  }, [fetchProfile]);

  const handleSignOut = useCallback(() => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    userIdRef.current = null;
    setCreatorContext({ id: null, name: null, email: null });
  }, []);

  useEffect(() => {
    let mounted = true;

    // CRITICAL FIX: setLoadingDone is ALWAYS called exactly once.
    // The previous version used fetchingRef as a lock — when INITIAL_SESSION
    // fired and set fetchingRef=true, getSession()'s handleUser bailed out,
    // and setIsLoadingAuth(false) was NEVER called → infinite loading screen.
    const setLoadingDone = () => {
      if (!mounted || loadingDoneRef.current) return;
      loadingDoneRef.current = true;
      setIsLoadingAuth(false);
      setAuthChecked(true);
    };

    const handleUser = async (authUser) => {
      if (!mounted) return;
      if (authUser.id === userIdRef.current) return; // already handled
      userIdRef.current = authUser.id;
      setUser(authUser);
      setIsAuthenticated(true);
      // Profile load is fire-and-forget — does NOT block the loading screen
      ensureProfile(authUser).catch(() => {});
    };

    // Step 1: getSession() — authoritative on page load/reload
    // .finally() guarantees setLoadingDone() always runs
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          await handleUser(session.user);
        } else {
          handleSignOut();
        }
      })
      .catch(() => {
        if (mounted) handleSignOut();
      })
      .finally(setLoadingDone); // ← ALWAYS clears loading screen

    // Step 2: Auth state listener for post-mount changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'TOKEN_REFRESHED') return; // silent, ignore

        if (event === 'INITIAL_SESSION') {
          // Fires immediately — handle only if getSession() lost the race
          if (!userIdRef.current && session?.user) {
            await handleUser(session.user);
          } else if (!session) {
            handleSignOut();
          }
          setLoadingDone(); // belt-and-suspenders: clear loading if still showing
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          await handleUser(session.user);
          setLoadingDone();
          return;
        }

        if (event === 'SIGNED_OUT') {
          handleSignOut();
          setLoadingDone();
          return;
        }

        if (event === 'USER_UPDATED' && session?.user) {
          setUser(session.user); // metadata update only, no profile re-fetch
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile, handleSignOut]);

  const logout = useCallback(async () => {
    handleSignOut();
    await supabase.auth.signOut();
  }, [handleSignOut]);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      loadingDoneRef.current = false;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.id !== userIdRef.current) {
        setUser(session.user);
        setIsAuthenticated(true);
        userIdRef.current = session.user.id;
        await ensureProfile(session.user);
      } else if (!session) {
        handleSignOut();
      }
    } catch {}
    loadingDoneRef.current = true;
    setIsLoadingAuth(false);
    setAuthChecked(true);
  }, [ensureProfile, handleSignOut]);

  const checkAppState = useCallback(async () => { await checkUserAuth(); }, [checkUserAuth]);
  const navigateToLogin = useCallback(() => {}, []);

  const displayName = profile?.full_name
    || user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'User';

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
