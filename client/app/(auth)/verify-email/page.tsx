// app/(auth)/verify-email/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import apiService from '@/services/apiservices';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [message, setMessage] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!uid || !token) {
        setError('Missing UID or token');
        return;
      }
      try {
        const body = JSON.stringify({ uid, token });
        const response = await apiService.postWithoutToken('/api/auth/verify-email/', body);

        if (response.error) {
          setError(response.error);
        } else if (response.message) {
          setMessage(response.message);
        }
      } catch (err) {
        setError('Error verifying email');
      }
    };

    verifyEmail();
  }, [uid, token]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Verify Email</h1>
      {message && <p className="text-green-500">{message}</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
