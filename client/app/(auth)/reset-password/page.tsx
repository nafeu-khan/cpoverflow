// app/(auth)/reset-password/page.tsx
'use client';

import { Suspense } from 'react';
import ResetPasswordForm from '@/components/forms/ResetPasswordForm';

function ResetPasswordContent() {
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
