/// useRegister – register a new user with @bu.edu email; mocks password for now; creates a user doc if it doesn't exist.
/// Usage: const { register, loading, error } = useRegister(); await register(email, password, role /* 'User' | 'Admin' */);

import { useCallback, useState } from 'react';
import { ensureUser, getUser, /* add these helpers below: */ getUserByEmail } from '../lib/firebase/users';
import type { Role } from '../lib/firebase/users';

const isBUEmail = (email: string) => /@bu\.edu$/i.test(email);

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string|null>(null);

  const register = useCallback(async (email: string, password: string, role: Role = 'User') => {
    setLoading(true); setError(null);
    try {
      if (!isBUEmail(email)) throw new Error('Please register with your @bu.edu email.');

      // Exists?
      const existing = await getUserByEmail(email);
      if (existing) throw new Error('An account with this email already exists.');

      // For now we’re not storing passwords (mock); when you switch to Clerk, password is handled by Clerk.
      // Create a deterministic UID for mock; Clerk later gives you userId.
      const uid = `mock_${role}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

      await ensureUser(uid, {
        email,
        name: 'New User',
        role,
        agreedToTerms: false,
      });

      // Return the freshly created user doc
      return await getUser(uid);
    } catch (e: any) {
      setError(e?.message ?? 'Registration failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { register, loading, error };
}
