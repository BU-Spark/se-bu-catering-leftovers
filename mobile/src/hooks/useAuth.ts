/// useAuth – holds session user in state; provides login/logout and reload; mock now, swap to Clerk later.
/// Usage: const { user, isAuthenticated, login, logout, reload } = useAuth();

import { useCallback, useMemo, useState } from 'react';
import { ensureUser, getUser, type Role } from '../lib/firebase/users';

export type SessionUser = {
  uid: string;
  email: string;
  name: string;
  role: Role;
  agreedToTerms: boolean;
};

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, role: Role) => {
    setLoading(true);
    try {
      // mock uid
      const uid = `mock_${role}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // ✅ correct signature: (uid, seed)
      await ensureUser(uid, {
        email,
        name: role === 'Admin' ? 'Admin User' : 'Student User',
        role,
        agreedToTerms: true,
      });

      const doc = await getUser(uid);
      if (doc) {
        setUser({
          uid: doc.uid,
          email: doc.email,
          name: doc.name,
          role: doc.role,
          agreedToTerms: doc.agreedToTerms,
        });
        return {
          uid: doc.uid,
          email: doc.email,
          name: doc.name,
          role: doc.role,
          agreedToTerms: doc.agreedToTerms,
        } as SessionUser;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const isAuthenticated = useMemo(() => !!user, [user]);

  const reload = useCallback(async () => {
    if (!user) return;
    const doc = await getUser(user.uid);
    if (doc) {
      setUser({
        uid: doc.uid,
        email: doc.email,
        name: doc.name,
        role: doc.role,
        agreedToTerms: doc.agreedToTerms,
      });
    }
  }, [user]);

  return { user, loading, login, logout, isAuthenticated, reload };
}
