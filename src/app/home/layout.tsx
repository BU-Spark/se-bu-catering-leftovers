import React from 'react';
import { UserProvider } from '@/context/UserContext';
import ProtectedRoute from '@/context/ProtectedRoute';

export default function EventsLayout({ children }: { children: React.ReactNode }) {

  return (
    <div>
        <UserProvider>
          <ProtectedRoute> 
              {children}
          </ProtectedRoute>
        </UserProvider>
    </div>
  );
}