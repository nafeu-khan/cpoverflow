'use client';

import { useState, useEffect } from 'react';
import { SearchParamsProps } from '@/types';
import QuestionCard from '../cards/QuestionCard';
import Pagination from './Pagination';
import apiService from '@/services/apiservices';

interface Props extends SearchParamsProps {
  userId: string;
}
const QuestionTab = ({ searchParams, userId }: Props) => {
  const [result, setResult] = useState<any>({ questions: [], isNext: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await apiService.get(`/api/users/${userId}/questions/?page=${searchParams.page || 1}`);
        if (response.success) {
          setResult({
            questions: response.questions || [],
            isNext: response.isNext || false
          });
        } else {
          setResult({ questions: [], isNext: false });
        }
      } catch (error) {
        console.error('Error fetching user questions:', error);
        setResult({ questions: [], isNext: false });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [userId, searchParams.page]);

  if (loading) {
    return <div>Loading questions...</div>;
  }

  return (
    <>
      {result.questions.map((question: any) => (
        <QuestionCard
          key={question.id}
          _id={question.id}
          title={question.title}
          tags={question.tags}
          author={question.author}
          upvotes={question.vote_score || 0}
          views={question.views}
          answers={question.answer_count || 0}
          createdAt={question.created_at}
        />
      ))}

      {/* Pagination */}
      <Pagination
        pageNumber={searchParams?.page ? +searchParams.page : 1}
        isNext={result.isNext}
      />
    </>
  );
};
export default QuestionTab;
