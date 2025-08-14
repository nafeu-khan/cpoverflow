'use client';

import { useEffect } from 'react';
import Question from '@/components/forms/Question';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const AskQuestion = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <div>Please log in to ask a question</div>;
  }

  return (
    <div>
      <h1 className="h1-bold text-dark100_light900">Ask a question</h1>

      <div className="mt-9">
        <Question userId={user.id} />
      </div>
    </div>
  );
};

export default AskQuestion;
