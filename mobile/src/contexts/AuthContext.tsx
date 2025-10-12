// src/contexts/AuthContext.tsx
import * as React from 'react';
import { ensureUser, getUser, type UserDoc } from '../lib/firebase/users';

type SessionUser = {
  uid: string;
  email: string;
  name: string;
  role: 'User' | 'Admin';
  agreedToTerms: boolean;
};

type AuthContextType = {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser | null>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(false);

  const login = React.useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock UID generation (replace with Clerk later)
      const uid = `mock_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // Check if user exists first
      let doc = await getUser(uid);
      
      // If user doesn't exist, create account (auto-registration)
      if (!doc) {
        // Determine role from email pattern (admin@bu.edu = Admin)
        const role = email.toLowerCase().includes('admin') ? 'Admin' : 'User';
        
        await ensureUser(uid, {
          email,
          name: role === 'Admin' ? 'Admin User' : 'Student User',
          role,
          agreedToTerms: true,
        });
        
        doc = await getUser(uid);
      }

      if (doc) {
        const sessionUser: SessionUser = {
          uid: doc.uid,
          email: doc.email,
          name: doc.name,
          role: doc.role,
          agreedToTerms: doc.agreedToTerms,
        };
        setUser(sessionUser);
        return sessionUser;
      }
      return null;
    } catch (e) {
      console.error('Login failed:', e);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}