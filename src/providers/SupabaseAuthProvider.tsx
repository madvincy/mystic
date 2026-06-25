// src/providers/SupabaseAuthProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { adminCacheUtils } from "@/lib/admin-cache";

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
  
  const isCheckingAdmin = useRef(false);
  const lastCheckTime = useRef(0);

  // ✅ Create user if not exists
  const createUserIfNotExists = async (user: User) => {
    try {
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
        return existingUser;
      }

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
        if (insertError.code === '23505') {
          const { data: existing } = await supabase
            .from('users')
            .select('id, email, is_admin')
            .eq('email', user.email)
            .maybeSingle();
          return existing;
        }
        return;
      }
      
      return newUser;
    } catch (error) {
      console.error('❌ Error in createUserIfNotExists:', error);
    }
  };

  // ✅ Check admin status with caching
  const checkAdminStatus = async (userId: string) => {
    // ✅ Check cache first
    const cachedStatus = adminCacheUtils.get(userId);
    if (cachedStatus !== null) {
      setIsAdmin(cachedStatus);
      return;
    }

    // ✅ Prevent duplicate requests
    if (isCheckingAdmin.current) {
      return;
    }

    // ✅ Debounce
    if (Date.now() - lastCheckTime.current < 2000) {
      return;
    }

    isCheckingAdmin.current = true;
    lastCheckTime.current = Date.now();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAdmin(false);
        isCheckingAdmin.current = false;
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.message?.includes('406')) {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            await createUserIfNotExists(userData.user);
            const { data: retryData } = await supabase
              .from('users')
              .select('is_admin')
              .eq('id', userId)
              .maybeSingle();
            
            const adminStatus = retryData?.is_admin || false;
            adminCacheUtils.set(userId, adminStatus);
            setIsAdmin(adminStatus);
            isCheckingAdmin.current = false;
            return;
          }
        }
        
        console.error('❌ Error checking admin status:', error);
        setIsAdmin(false);
        isCheckingAdmin.current = false;
        return;
      }

      const adminStatus = data?.is_admin || false;
      adminCacheUtils.set(userId, adminStatus);
      setIsAdmin(adminStatus);
      
    } catch (error) {
      console.error('❌ Admin check error:', error);
      setIsAdmin(false);
    } finally {
      isCheckingAdmin.current = false;
    }
  };

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

  // ✅ Initialize auth - only once
  useEffect(() => {
    let isMounted = true;
    let initDone = false;

    const initAuth = async () => {
      if (initDone) return;
      initDone = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && isMounted) {
          setUser(session.user);
          await createUserIfNotExists(session.user);
          await checkAdminStatus(session.user.id);
        }
      } catch (error) {
        console.error('❌ Auth init error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // ✅ Auth state change handler with debouncing
    let authTimeout: NodeJS.Timeout | null = null;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (authTimeout) {
        clearTimeout(authTimeout);
        authTimeout = null;
      }

      authTimeout = setTimeout(async () => {
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          await createUserIfNotExists(session.user);
          await checkAdminStatus(session.user.id);
        } else {
          setUser(null);
          setIsAdmin(false);
          adminCacheUtils.clear();
        }
        setLoading(false);
      }, 100);
    });

    return () => {
      isMounted = false;
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        setUser(data.user);
        await createUserIfNotExists(data.user);
        await checkAdminStatus(data.user.id);
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
    adminCacheUtils.clear();
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