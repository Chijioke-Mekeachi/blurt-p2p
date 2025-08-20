// Import necessary React hooks and Supabase types
import React, { createContext, useContext, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase'; // Supabase client and Profile type
import { toast } from 'react-hot-toast'; // For showing success/error messages

// Define the shape of the AuthContext object
interface AuthContextType {
  user: User | null; // Current Supabase user
  profile: Profile | null; // Custom profile data from "profiles" table
  loading: boolean; // Whether auth/profile is being fetched
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

// Create the actual context (initially undefined)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a custom hook for easy context access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// This is the context provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);        // Track current Supabase user
  const [profile, setProfile] = useState<Profile | null>(null); // Track app profile
  const [loading, setLoading] = useState<boolean>(false);       // Loading state

  // Manually fetch profile from Supabase "profiles" table by email
  const fetchProfile = async (email: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;

      setProfile(data || null); // Update profile state
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Sign up a new user and create a profile
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

      // Create a new Supabase user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { ...userData, email } }, // optional metadata
      });

      if (error) throw error;

      // If user creation succeeds, insert into custom "profiles" table
      if (data.user) {
        const now = new Date().toISOString();
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              email,
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

      toast.success('Account created! Please verify your email.');
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in a user and fetch their profile
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Supabase handles login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // After successful login, fetch and store user + profile
      setUser(data.user);
      if (data.user?.email) {
        await fetchProfile(data.user.email);
      }

      toast.success('Signed in successfully!');
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out and reset state
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear user and profile from state
      setUser(null);
      setProfile(null);

      toast.success('Signed out successfully!');
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message);
    }
  };

  // Update user's profile in Supabase "profiles" table
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.email) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('email', user.email);

      if (error) throw error;

      // Update local state with new profile data
      setProfile(prev => (prev ? { ...prev, ...updates } : null));

      toast.success('Profile updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  // Provide the context to children components
  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
