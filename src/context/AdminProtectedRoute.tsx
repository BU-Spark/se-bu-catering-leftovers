'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './UserContext';
import CircularProgress from '@mui/material/CircularProgress';

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
    return <CircularProgress />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;