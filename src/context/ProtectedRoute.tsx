'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './UserContext';
import CircularProgress from '@mui/material/CircularProgress';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useUser();
  const router = useRouter();

  if (loading) {
    return <CircularProgress />;
  }

  if (!loading && !user) {
    router.push('/');
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;