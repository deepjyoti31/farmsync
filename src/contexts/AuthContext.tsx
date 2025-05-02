
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
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
  const navigate = useNavigate();

  // Track if this is the initial auth check to avoid showing toast on app startup/refresh
  const [isInitialAuthCheck, setIsInitialAuthCheck] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Only show toast messages for explicit user actions, not on initial load or refresh
        if (!isInitialAuthCheck) {
          if (event === 'SIGNED_IN') {
            // Don't show toast on automatic sign-ins (page refresh, etc.)
            // We'll show toasts explicitly in the signIn function instead
          } else if (event === 'SIGNED_OUT') {
            // Don't show toast on automatic sign-outs (session expiry, etc.)
            // We'll show toasts explicitly in the signOut function instead
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
    <AuthContext.Provider value={{ session, user, signUp, signIn, signOut, loading }}>
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
