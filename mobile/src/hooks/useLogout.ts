// src/hooks/useLogout.ts
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';

export function useLogout() {
  const { signOut } = useAuth();

  const logout = async () => {
    await signOut();
    router.replace('/');
  };

  return { logout };
}