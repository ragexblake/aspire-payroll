import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Demo users for fallback authentication
const demoUsers = [
  {
    id: 'demo-admin-1',
    full_name: 'Admin User',
    email: 'admin@payrollpro.com',
    password: 'admin123',
    role: 'admin' as const,
    plant_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-manager-1',
    full_name: 'Plant Manager',
    email: 'manager@payrollpro.com',
    password: 'manager123',
    role: 'manager' as const,
    plant_id: 'demo-plant-1',
    created_at: new Date().toISOString(),
  },
];

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager';
  plant_id: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: 'admin' | 'manager', plantId?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here' || supabaseKey === 'your_supabase_anon_key_here') {
        console.log('Supabase not configured, skipping profile fetch');
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.log('Supabase profile fetch failed, using demo mode:', error.message);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.log('Network error fetching profile, continuing with demo mode:', error);
    }
  };

  const getDemoUser = (email: string, password: string) => {
    // Check built-in demo users
    const builtInUser = demoUsers.find(user => user.email === email && user.password === password);
    if (builtInUser) return builtInUser;

    // Check localStorage demo users
    try {
      const storedUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
      return storedUsers.find((user: any) => user.email === email && user.password === password);
    } catch {
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Try demo authentication first for better reliability
      const demoUser = getDemoUser(email, password);
      if (demoUser) {
        // Set demo user state
        setUser({ id: demoUser.id, email: demoUser.email } as User);
        setProfile(demoUser);
        setSession(null);
        return { error: null };
      }

      // Try Supabase authentication as fallback
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Return a user-friendly error message
        return { error: new Error('Invalid email or password. Try demo credentials: admin@payrollpro.com / admin123') };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: 'admin' | 'manager', 
    plantId?: string
  ) => {
    try {
      // Try Supabase signup first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { error: new Error(authError.message) };
      }

      if (authData.user) {
        // Try to create profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            full_name: fullName,
            email,
            role,
            plant_id: plantId || null,
          });

        if (!profileError) {
          return { error: null };
        }
        
        return { error: new Error(profileError.message) };
      }

      // If Supabase signup didn't return a user, try demo fallback for admin
      if (role === 'admin') {
        const demoUser = {
          id: `demo-${Date.now()}`,
          full_name: fullName,
          email,
          role: 'admin' as const,
          plant_id: null,
          created_at: new Date().toISOString(),
        };
        
        // Store in localStorage
        try {
          const existingUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
          const updatedUsers = [...existingUsers, { ...demoUser, password }];
          localStorage.setItem('demoUsers', JSON.stringify(updatedUsers));
          return { error: null };
        } catch (storageError) {
          return { error: new Error('Failed to create demo account') };
        }
      }

      return { error: new Error('Failed to create account') };
    } catch (error) {
      // Wrap any caught errors in Error object with proper message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      return { error: new Error(errorMessage) };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}