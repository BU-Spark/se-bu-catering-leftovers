import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("🔐 Index: Auth state changed:", u ? "User logged in" : "No user");
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  console.log("🎯 Index: Current user state:", user);
  console.log("⏳ Index: Loading state:", loading);

  if (loading) {
    return null; // or a loading component
  }

  // Redirect based on authentication state
  if (user) {
    console.log("🔄 Index: Redirecting to tabs");
    return <Redirect href="/(tabs)" />;
  } else {
    console.log("🔄 Index: Redirecting to login");
    return <Redirect href="/login" />;
  }
}
