import React from 'react';
import { UserProvider } from "@/context/UserContext";
import AdminProtectedRoute from "@/context/AdminProtectedRoute";

export default function AdminLayout({ children }: { children: React.ReactNode }) {

  return (
    <div>
      <UserProvider>
        <AdminProtectedRoute>
          {children}
        </AdminProtectedRoute>
      </UserProvider>
    </div>
  );
}