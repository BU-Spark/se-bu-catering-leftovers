'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './UserContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user ){
      router.push('/');
    } else if (!loading && user && user.role !== 'Admin'){
      router.push('/events/explore');
    }
  }, [user, loading, router]);

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

  if (!loading && user && user.role === 'Admin') {
    return <>{children}</>;
  }
};

export default AdminProtectedRoute;