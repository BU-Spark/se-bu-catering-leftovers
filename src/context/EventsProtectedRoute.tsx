'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './UserContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const EventsProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useUser();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else if (!user.agreedToTerms && !hasRedirected) {
        alert('You must agree to the terms and conditions before you can access the events.');
        router.push('/terms');
        setHasRedirected(true);
      }
    }
  }, [user, loading, hasRedirected, router]);

  if (loading || (!user && !hasRedirected)) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!loading && user && user.agreedToTerms) {
    return <>{children}</>;
  }
};

export default EventsProtectedRoute;