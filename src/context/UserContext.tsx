'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { User } from '@/types/types';
import { auth, firestore as db } from '@/../firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface UserContextProps {
  user: User | null;
  loading: boolean;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

   
  // Update and store any user changes
  useEffect(() => {
    const unsubscribeFromAuth = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'Users', authUser.uid);
      
      // Listen to real-time updates from Firestore
      const unsubscribeFromUser = onSnapshot(userRef, (userDoc) => {
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribeFromUser();
    });

    return () => unsubscribeFromAuth();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};