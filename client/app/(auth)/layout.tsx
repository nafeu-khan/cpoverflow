// app/(auth)/layout.tsx
import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import '../globals.css';

export const metadata = {
  title: 'Authentication - CPoverFlow',
  description: 'Sign in or create an account to access CPoverFlow',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            {children}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
