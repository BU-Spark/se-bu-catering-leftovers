import React from 'react';
import { UserProvider } from '@/context/UserContext';
import EventsProtectedRoute from '@/context/EventsProtectedRoute';

export default function EventsLayout({ children }: { children: React.ReactNode }) {

  return (
    <div>
        <UserProvider>
          <EventsProtectedRoute> 
              {children}
          </EventsProtectedRoute>
        </UserProvider>
    </div>
  );
}