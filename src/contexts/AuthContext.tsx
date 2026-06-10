import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type Role = 'ADMIN' | 'EMPLOYEE' | 'WORKER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  department_id?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password?: string, metaData?: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo seed data based on user request
const DEMO_USERS: Record<string, User> = {
  'admin@jswworkflow.com': {
    id: 'demo-admin-id',
    email: 'admin@jswworkflow.com',
    name: 'Admin User',
    role: 'ADMIN',
  },
  'employee@jswworkflow.com': {
    id: 'demo-employee-id',
    email: 'employee@jswworkflow.com',
    name: 'Employee User',
    role: 'EMPLOYEE',
    department_id: 'dept-1'
  },
  'worker@jswworkflow.com': {
    id: 'demo-worker-id',
    email: 'worker@jswworkflow.com',
    name: 'Worker User',
    role: 'WORKER',
    department_id: 'dept-1'
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Fetch extra user details if necessary or use metadata
                const { data: dbUser } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                if (dbUser) {
                    setUser({
                        id: dbUser.id,
                        email: dbUser.email,
                        name: dbUser.full_name,
                        role: dbUser.role,
                        department_id: dbUser.department_id
                    });
                } else {
                    // Fallback using raw auth meta if row isn't populated
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        name: session.user.user_metadata?.full_name || 'Demo User',
                        role: (session.user.user_metadata?.role as Role) || 'WORKER'
                    });
                }
            } else {
                // Attempt to load from localStorage for demo persistence if not Supabase
                const storedUser = localStorage.getItem('jsw_demo_user');
                if (storedUser) {
                  setUser(JSON.parse(storedUser));
                }
            }
            
            // Listen for changes
            supabase.auth.onAuthStateChange((_event, session) => {
                if (!session) {
                    setUser(null);
                }
            });
        } else {
            // Attempt to load from localStorage for demo persistence
            const storedUser = localStorage.getItem('jsw_demo_user');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
        }
        setLoading(false);
    };
    initAuth();
  }, []);

  const register = async (email: string, password?: string, metaData?: any) => {
      setLoading(true);
      try {
          if (supabase) {
              if (!password) throw new Error("Password is required for registration");
              const { data, error } = await supabase.auth.signUp({ 
                  email, 
                  password, 
                  options: {
                      data: metaData
                  }
              });
              if (error) throw error;
          } else {
              // Mock auth
              console.log("Mock Registration:", email);
          }
      } finally {
          setLoading(false);
      }
  };

  const login = async (email: string, password?: string) => {
    setLoading(true);
    
    try {
        if (supabase && password) {
           const { data, error } = await supabase.auth.signInWithPassword({ email, password });
           if (error) {
               // If it's a demo user and login fails, bypass Supabase and mock log in
               if (DEMO_USERS[email] && error.message.includes('Invalid login credentials')) {
                   const demoUser = DEMO_USERS[email];
                   setUser(demoUser);
                   localStorage.setItem('jsw_demo_user', JSON.stringify(demoUser));
                   return;
               }
               throw error;
           }
           
           if (data.session) {
               const { data: dbUser } = await supabase.from('users').select('*').eq('id', data.session.user.id).single();
               if (dbUser) {
                    setUser({
                        id: dbUser.id,
                        email: dbUser.email,
                        name: dbUser.full_name,
                        role: dbUser.role,
                        department_id: dbUser.department_id
                    });
               } else {
                   setUser({
                        id: data.session.user.id,
                        email: email,
                        name: data.session.user.user_metadata?.full_name || 'Demo User',
                        role: 'WORKER'
                    });
               }
           }
           return;
        }

        // Mock Auth fallback for AI studio / one-click demo
        const demoUser = DEMO_USERS[email];
        if (demoUser) {
           setUser(demoUser);
           localStorage.setItem('jsw_demo_user', JSON.stringify(demoUser));
        } else {
           // Fallback for non-demo users if we want them to enter
           const fallbackUser: User = {
             id: 'new-user',
             email: email,
             name: 'Test User',
             role: 'WORKER' // default
           };
           setUser(fallbackUser);
           localStorage.setItem('jsw_demo_user', JSON.stringify(fallbackUser));
        }
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
        if (supabase) {
            await supabase.auth.signOut();
        }
        setUser(null);
        localStorage.removeItem('jsw_demo_user');
    } finally {
        setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
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
