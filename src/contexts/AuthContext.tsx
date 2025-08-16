import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userData: {
      username: string;
      full_name: string;
      bio: string;
      phone: string;
    }
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) fetchProfile(session.user.email);
      else setLoading(false);
    });

    const { subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user?.email) await fetchProfile(session.user.email);
        else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Fetch profile by email
  const fetchProfile = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;
      setProfile(data || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Signup with automatic profile creation
  const signUp = async (
    email: string,
    password: string,
    userData: {
      username: string;
      full_name: string;
      bio: string;
      phone: string;
    }
  ) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { ...userData, email } },
      });

      if (error) throw error;

      if (data.user) {
        const now = new Date().toISOString();
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              email: email,
              username: userData.username,
              full_name: userData.full_name,
              bio: userData.bio,
              phone: userData.phone,
              avatar_url: '',
              created_at: now,
              updated_at: now,
            },
          ]);

        if (profileError) throw profileError;
      }

      toast.success(
        'Account created successfully! Please check your email to verify your account.'
      );
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Signed in successfully!');
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully!');
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.email) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('email', user.email);

      if (error) throw error;
      setProfile(prev => (prev ? { ...prev, ...updates } : null));
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const value = { user, profile, loading, signUp, signIn, signOut, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
