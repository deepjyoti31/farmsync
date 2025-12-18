
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

import { Organization, OrganizationMember } from '@/types/rbac';

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
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Organization State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);

  const navigate = useNavigate();

  // Track if this is the initial auth check to avoid showing toast on app startup/refresh
  const [isInitialAuthCheck, setIsInitialAuthCheck] = useState(true);

  const refreshOrganizations = async () => {
    if (!user) return;
    setIsLoadingOrganizations(true);
    try {
      // Fetch organizations where the user is a member
      const { data: members, error } = await supabase
        .from('organization_members')
        .select('role, organization:organizations(*)')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching organizations:', error);
        return;
      }

      if (members && members.length > 0) {
        // Extract organizations from the response
        const orgs = members.map(m => m.organization).filter(Boolean) as Organization[];

        // Ensure unique organizations (handle potential duplicates if backend doesn't)
        const uniqueOrgs = Array.from(new Map(orgs.map(org => [org.id, org])).values());

        setOrganizations(uniqueOrgs);

        // If no current organization is selected, select the personal one or the first one
        if (!currentOrganization && uniqueOrgs.length > 0) {
          const personalOrg = uniqueOrgs.find(org => org.is_personal);
          const defaultOrg = personalOrg || uniqueOrgs[0];
          setCurrentOrganization(defaultOrg);

          // Set role for the default org
          const memberRecord = members.find(m => m.organization?.id === defaultOrg.id);
          setUserRole(memberRecord?.role || null);
        }
      } else {
        setOrganizations([]);
        setCurrentOrganization(null);
        setUserRole(null);
      }
    } catch (err) {
      console.error('Unexpected error loading organizations:', err);
    } finally {
      setIsLoadingOrganizations(false);
    }
  };

  // Update role when organization changes
  useEffect(() => {
    if (user && currentOrganization) {
      const fetchRole = async () => {
        const { data, error } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('organization_id', currentOrganization.id)
          .single();

        if (data) {
          setUserRole(data.role);
        }
      };

      fetchRole();
    }
  }, [currentOrganization, user]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Only show toast messages for explicit user actions, not on initial load or refresh
        if (!isInitialAuthCheck) {
          if (event === 'SIGNED_IN') {
            // Logic handled in signIn
          } else if (event === 'SIGNED_OUT') {
            setOrganizations([]);
            setCurrentOrganization(null);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      // Mark initial auth check as complete
      setIsInitialAuthCheck(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isInitialAuthCheck]);

  // Load organizations when user is set
  useEffect(() => {
    if (user) {
      refreshOrganizations();
    }
  }, [user]);

  const signUp = async (email: string, password: string, metadata: { first_name: string; last_name: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        }
      });

      if (error) throw error;

      toast({
        title: "Account created",
        description: "Your account has been created successfully. Please check your email for verification.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Show success toast only for explicit user-initiated sign-ins
      toast({
        title: "Success",
        description: "You have successfully signed in.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid login credentials.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Show success toast only for explicit user-initiated sign-outs
      toast({
        title: "Signed out",
        description: "You have been signed out.",
      });

      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign out.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
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
      loading
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
