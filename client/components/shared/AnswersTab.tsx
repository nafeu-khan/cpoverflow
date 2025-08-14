'use client';

import { useState, useEffect } from 'react';
import { SearchParamsProps } from '@/types';
import AnswerCard from '../cards/AnswerCard';
import Pagination from './Pagination';
import apiService from '@/services/apiservices';

interface Props extends SearchParamsProps {
  userId: string;
}
const AnswersTab = ({ searchParams, userId }: Props) => {
  const [result, setResult] = useState<any>({ answers: [], isNext: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        const response = await apiService.get(`/api/users/${userId}/answers/?page=${searchParams.page || 1}`);
        if (response.success) {
          setResult({
            answers: response.answers || [],
            isNext: response.isNext || false
          });
        } else {
          setResult({ answers: [], isNext: false });
        }
      } catch (error) {
        console.error('Error fetching user answers:', error);
        setResult({ answers: [], isNext: false });
      } finally {
        setLoading(false);
      }
    };

    fetchAnswers();
  }, [userId, searchParams.page]);

  if (loading) {
    return <div>Loading answers...</div>;
  }

  return (
    <>
      {result.answers.map((answer: any) => (
        <AnswerCard
          key={answer.id}
          _id={answer.id}
          question={answer.question}
          author={answer.author}
          upvotes={answer.vote_score || 0}
          createdAt={answer.created_at}
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
export default AnswersTab;
