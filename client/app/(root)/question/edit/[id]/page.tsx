'use client';

import { useState, useEffect } from 'react';
import Question from '@/components/forms/Question';
import { ParamsProps } from '@/types';
import apiService from '@/services/apiservices';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const EditQuestion = ({ params }: ParamsProps) => {
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch question details
        const questionResponse = await apiService.get(`/api/questions/${params.id}/`);
        setQuestion(questionResponse.data);
      } catch (error) {
        console.error('Error fetching question:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [params.id, isAuthenticated, authLoading, router]);

  if (authLoading || loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <div>Please log in to edit this question</div>;
  }

  if (!question) {
    return <div>Question not found</div>;
  }

  return (
    <>
      <h1 className="h1-bold text-dark100_light900 ">Edit Question</h1>

      <div className="mt-9">
        <Question
          type="edit"
          userId={user.id}
          questionDetails={JSON.stringify(question)}
        />
      </div>
    </>
  );
};
export default EditQuestion;
