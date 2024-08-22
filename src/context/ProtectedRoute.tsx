'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './UserContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useUser();
  const router = useRouter();

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', 
        justifyContent: 'center', height: '100vh'}}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!loading && !user) {
    router.push('/');
    return null;
  }

  if (!loading && user) {
    return <>{children}</>;
  }
};

export default ProtectedRoute;