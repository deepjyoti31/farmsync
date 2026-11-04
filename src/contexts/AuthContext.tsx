import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

import { Organization } from '@/types/rbac';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization) => void;
  userRole: string | null;
  isLoadingOrganizations: boolean;
  refreshOrganizations: () => Promise<void>;
  signUp: (email: string, password: string, metadata: { first_name: string; last_name: string }) => Promise<void>;
  /** Signs in and navigates to `redirectTo` (default /dashboard). */
  signIn: (email: string, password: string, redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The query cache is persisted to localStorage so records stay readable offline.
// Remember whose data it holds, so the next person on a shared phone never sees it.
const CACHE_OWNER_KEY = 'farmsync.cache-owner';
const orgKey = (userId: string) => `farmsync.org.${userId}`;

const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStorage = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage can be unavailable in private windows */
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
  // The user's role in each organization, from the same query that lists them,
  // so the role always matches the selected organization.
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const resetOrganizations = useCallback(() => {
    setOrganizations([]);
    setCurrentOrganizationState(null);
    setRoles({});
  }, []);

  const setCurrentOrganization = useCallback(
    (org: Organization) => {
      setCurrentOrganizationState(org);
      if (userId) writeStorage(orgKey(userId), org.id);
    },
    [userId],
  );

  const refreshOrganizations = useCallback(async () => {
    if (!userId) return;
    setIsLoadingOrganizations(true);
    try {
      // Join any team this user's email address was invited to. Older databases
      // without the function just return an error, which is fine to ignore.
      await supabase.rpc('accept_organization_invites');

      const { data: members, error } = await supabase
        .from('organization_members')
        .select('role, organization:organizations(*)')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching organizations:', error);
        return;
      }

      const orgs = Array.from(
        new Map(
          (members ?? [])
            .map((m) => m.organization as Organization | null)
            .filter((o): o is Organization => !!o)
            .map((o) => [o.id, o]),
        ).values(),
      );
      setOrganizations(orgs);
      setRoles(Object.fromEntries((members ?? []).filter((m) => m.organization).map((m) => [(m.organization as Organization).id, m.role])));

      // Keep the selected organization if the user still belongs to it (with its
      // latest name), otherwise fall back to the last one used, then personal.
      setCurrentOrganizationState((current) => {
        const stillMember = current && orgs.find((o) => o.id === current.id);
        if (stillMember) return stillMember;
        const remembered = orgs.find((o) => o.id === readStorage(orgKey(userId)));
        return remembered ?? orgs.find((o) => o.is_personal) ?? orgs[0] ?? null;
      });
    } catch (err) {
      console.error('Unexpected error loading organizations:', err);
    } finally {
      setIsLoadingOrganizations(false);
    }
  }, [userId]);

  useEffect(() => {
    const applySession = (event: string | null, currentSession: Session | null) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      const nextId = currentSession?.user?.id ?? null;
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        writeStorage(CACHE_OWNER_KEY, null);
        resetOrganizations();
      } else if (nextId) {
        const owner = readStorage(CACHE_OWNER_KEY);
        if (owner && owner !== nextId) queryClient.clear();
        writeStorage(CACHE_OWNER_KEY, nextId);
      }
    };

    // Subscribe once. Supabase replays the current session as INITIAL_SESSION.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => applySession(event, currentSession));

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      applySession(null, currentSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient, resetOrganizations]);

  // Load organizations when the signed-in user changes (not on every token refresh).
  useEffect(() => {
    if (userId) refreshOrganizations();
    else resetOrganizations();
  }, [userId, refreshOrganizations, resetOrganizations]);

  const signUp = async (email: string, password: string, metadata: { first_name: string; last_name: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      if (data.session) {
        // Email confirmation is off: the user is already signed in.
        toast({ title: 'Account created', description: 'Welcome to FarmSync.' });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Account created',
          description: 'Please check your email to confirm your address, then log in.',
        });
        navigate('/login');
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'An error occurred during sign up.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string, redirectTo = '/dashboard') => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'You have successfully signed in.',
      });

      navigate(redirectTo, { replace: true });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Invalid login credentials.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: 'Signed out',
        description: 'You have been signed out.',
      });

      navigate('/login');
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'An error occurred during sign out.',
        variant: 'destructive',
      });
    }
  };

  const userRole = currentOrganization ? roles[currentOrganization.id] ?? null : null;

  const value = useMemo(
    () => ({
      session,
      user,
      organizations,
      currentOrganization,
      setCurrentOrganization,
      userRole,
      isLoadingOrganizations,
      refreshOrganizations,
      signUp,
      signIn,
      signOut,
      loading,
    }),
    // signUp/signIn/signOut only close over navigate and toast.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, user, organizations, currentOrganization, setCurrentOrganization, userRole, isLoadingOrganizations, refreshOrganizations, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
