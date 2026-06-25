// src/providers/SupabaseAuthProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  refreshUser: async () => {},
});

export const useSupabaseAuth = () => useContext(AuthContext);

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Function to create or update user (UPSERT)
  const upsertUser = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          name: user.user_metadata?.name || user.email || "User",
          email: user.email,
          phone: user.user_metadata?.phone || "",
          address: "",
          city: "",
          country: "Kenya",
          is_admin: user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL,
          is_banned: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id', // ✅ Upsert by ID
          ignoreDuplicates: false,
        })
        .select()
        .maybeSingle();

      if (error) {
        // If ID conflict, try upsert by email
        if (error.code === '23505') {
          const { data: emailData, error: emailError } = await supabase
            .from('users')
            .upsert({
              email: user.email,
              name: user.user_metadata?.name || user.email || "User",
              phone: user.user_metadata?.phone || "",
              address: "",
              city: "",
              country: "Kenya",
              is_admin: user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL,
              is_banned: false,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'email', // ✅ Upsert by email
              ignoreDuplicates: false,
            })
            .select()
            .maybeSingle();
          
          if (emailError) {
            console.error('❌ Error upserting by email:', emailError);
          } else {
            console.log('✅ User upserted by email:', emailData?.email);
          }
          return emailData;
        }
        
        console.error('❌ Error upserting user:', error);
        return null;
      }

      return data;
      
    } catch (error) {
      console.error('❌ Error in upsertUser:', error);
      return null;
    }
  };

  // ✅ Simpler version: Check and create if not exists
  const createUserIfNotExists = async (user: User) => {
    try {
      
      // First check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email, is_admin')
        .eq('email', user.email)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking user:', checkError);
        return;
      }

      if (existingUser) {
        setIsAdmin(existingUser.is_admin || false);
        return existingUser;
      }

      // User doesn't exist, create them
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email || "User",
          email: user.email,
          phone: user.user_metadata?.phone || "",
          address: "",
          city: "",
          country: "Kenya",
          is_admin: user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL,
          is_banned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('❌ Error creating user:', insertError);
        // If duplicate email, try to get the existing user
        if (insertError.code === '23505') {
          const { data: existing } = await supabase
            .from('users')
            .select('id, email, is_admin')
            .eq('email', user.email)
            .maybeSingle();
          
          if (existing) {
            setIsAdmin(existing.is_admin || false);
            return existing;
          }
        }
        return;
      }
      setIsAdmin(newUser?.is_admin || false);
      return newUser;
      
    } catch (error) {
      console.error('❌ Error in createUserIfNotExists:', error);
    }
  };

  // src/providers/SupabaseAuthProvider.tsx
const checkAdminStatus = async (userId: string) => {
  try {    
    // ✅ First check if we have a session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      setIsAdmin(false)
      return
    }

    // ✅ Try to get user data with explicit headers
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      // ✅ Handle 406 error specifically
      if (error.message?.includes('406')) {
        // Try to create the user
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          await createUserIfNotExists(userData.user)
          // Retry the check
          const { data: retryData } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', userId)
            .maybeSingle()
          setIsAdmin(retryData?.is_admin || false)
          return
        }
        setIsAdmin(false)
        return
      }
      
      console.error('❌ Error checking admin status:', error)
      setIsAdmin(false)
      return
    }
    setIsAdmin(data?.is_admin || false)
    
  } catch (error) {
    console.error('❌ Admin check error:', error)
    setIsAdmin(false)
  }
}

  const refreshUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Error refreshing user:', error);
        return;
      }
      
      if (user) {
        setUser(user);
        await createUserIfNotExists(user);
        await checkAdminStatus(user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await createUserIfNotExists(session.user);
          await checkAdminStatus(session.user.id);
        } else {
          console.log('👤 No session found');
        }
      } catch (error) {
        console.error('❌ Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await createUserIfNotExists(session.user);
        await checkAdminStatus(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ... rest of the signIn, signUp, signOut functions remain the same

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // ✅ Create user if doesn't exist after sign in
      if (data?.user) {
        await createUserIfNotExists(data.user);
        await checkAdminStatus(data.user.id);
        setUser(data.user);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
        name: name,
        phone: "",
        address: "",
        city: "",
        country: "Kenya",
        is_admin: email === process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Error creating user profile:", insertError);
        throw insertError;
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setIsAdmin(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        resetPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
