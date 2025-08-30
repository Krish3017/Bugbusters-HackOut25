import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { validateAdminSecretKey } from '@/config/admin';
import { emergencyDatabaseSetup } from '@/integrations/supabase/emergency-setup';

interface Profile {
  id: string;
  full_name: string | null;
  role: 'community' | 'authority';
  points: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'community' | 'authority', adminSecretKey?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = (userId: string) => {
    try {
      // Get profile from emergency setup
      const emergencyProfile = emergencyDatabaseSetup.getUserProfile(userId);
      if (emergencyProfile) {
        setProfile(emergencyProfile);
        return;
      }

      // Fallback to database (but don't block the UI)
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setProfile(data);
          }
        })
        .catch((error) => {
          console.error('Error fetching profile:', error);
        });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use emergency profile as fallback
      const emergencyProfile = emergencyDatabaseSetup.getUserProfile(userId);
      if (emergencyProfile) {
        setProfile(emergencyProfile);
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Initialize database and fetch profile
          try {
            emergencyDatabaseSetup.initializeDatabase();
            fetchProfile(session.user.id);
          } catch (error) {
            console.error('Error initializing database:', error);
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          emergencyDatabaseSetup.initializeDatabase();
          fetchProfile(session.user.id);
        } catch (error) {
          console.error('Error initializing database:', error);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: 'community' | 'authority', adminSecretKey?: string) => {
    // Validate admin secret key if trying to sign up as authority
    if (role === 'authority') {
      if (!adminSecretKey) {
        return { error: { message: 'Admin secret key is required for authority accounts' } };
      }
      
      // Check if the secret key matches
      if (!validateAdminSecretKey(adminSecretKey)) {
        return { error: { message: 'Invalid admin secret key' } };
      }
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { 
          full_name: fullName,
          role: role // Store role in user metadata
        }
      }
    });
    
    if (!error) {
      // Create profile with the selected role
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: fullName,
              role: role,
              points: 0
            });
          
          if (profileError) {
            console.error('Error creating profile:', profileError);
          } else {
            console.log('Profile created successfully during signup');
          }
        }
      } catch (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};