/// useEmailLogin – sign in with @bu.edu email + password (mock today, Clerk later). Ensures a user doc exists.
/// Usage: const { login, loading, error } = useEmailLogin(); const user = await login(email, password);

import { useCallback, useState } from 'react';
import { getUser, ensureUser } from '../lib/firebase/users';

const isBUEmail = (email: string) => /@bu\.edu$/i.test(email);

export function useEmailLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string|null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      if (!isBUEmail(email)) throw new Error('Please sign in with your @bu.edu email.');

      // Mock: derive uid from email (will replace with Clerk later)
      const uid = `mock_User_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Ensure there is a user doc
      await ensureUser(uid, { email, name: 'Student User', role: 'User' });

      const doc = await getUser(uid);
      if (!doc) throw new Error('Sign-in failed');
      return doc;
    } catch (e: any) {
      setError(e?.message ?? 'Sign-in failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, loading, error };
}
