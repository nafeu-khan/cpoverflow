'use client';

import { useState, useEffect, useMemo } from 'react';
import HomeFilters from '@/components/home/HomeFilters';
import Filter from '@/components/shared/Filter';
import NoResult from '@/components/shared/NoResult';
import Pagination from '@/components/shared/Pagination';
import LocalSearchbar from '@/components/shared/search/LocalSearchbar';
import { Button } from '@/components/ui/button';
import { HomePageFilters } from '@/constants/filters';
import { SearchParamsProps } from '@/types';
import Link from 'next/link';
import QuestionCard from '@/components/cards/QuestionCard';
import apiService from '@/services/apiservices';

export default function Home({ searchParams }: SearchParamsProps) {
  const [questions, setQuestions] = useState([]);
  const [isNext, setIsNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize search parameters to prevent unnecessary re-renders
  const page = useMemo(() => searchParams?.page ? parseInt(searchParams.page) : 1, [searchParams?.page]);
  const search = useMemo(() => searchParams?.q || '', [searchParams?.q]);
  const filter = useMemo(() => searchParams?.filter || '', [searchParams?.filter]);

  useEffect(() => {
    // Debounce API calls to prevent excessive requests
    const timeoutId = setTimeout(() => {
      const fetchQuestions = async () => {
        try {
          setLoading(true);
          setError(null);
          
          let url = `/api/questions/?page=${page}`;
          
          if (search) {
            url += `&search=${encodeURIComponent(search)}`;
          }
          
          if (filter && filter !== 'newest') {
            // Map frontend filter names to backend sorting
            const filterMap: { [key: string]: string } = {
              'recommended': 'recommended',
              'frequent': 'frequent',
              'unanswered': 'unanswered'
            };
            
            if (filterMap[filter]) {
              url += `&filter=${filterMap[filter]}`;
            }
          }

          console.log('Fetching questions from:', url); // Debug log

          const response = await apiService.get(url);
          console.log('API Response:', response); // Debug log
          
          if (response.success) {
            console.log('Questions data:', response.questions); // Debug log
            setQuestions(response.questions || []);
            setIsNext(response.isNext || false);
          } else {
            setError(`Failed to fetch questions: ${response.error || 'Unknown error'}`);
          }
        } catch (error: any) {
          console.error('Error fetching questions:', error);
          setError(`Failed to fetch questions: ${error.message || error.toString()}`);
          setQuestions([]);
        } finally {
          setLoading(false);
        }
      };

      fetchQuestions();
    }, search ? 300 : 0); // Debounce search queries by 300ms, immediate for page/filter changes

    return () => clearTimeout(timeoutId);
  }, [page, search, filter]); // Use individual memoized values

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-dark400_light800">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="h1-bold text-dark100_light900">All Questions</h1>

        <Link href="/ask-question" className="flex justify-end max-sm:w-full">
          <Button className="primary-gradient min-h-[46px] px-4 py-3 !text-light-900">
            Ask a Question
          </Button>
        </Link>
      </div>

      <div className="mt-11 flex justify-between gap-5 max-sm:flex-col sm:items-center">
        <LocalSearchbar
          route="/"
          iconPosition="left"
          imgSrc="/assets/icons/search.svg"
          placeholder="Search for questions"
          otherClasses="flex-1"
        />

        <Filter
          filters={HomePageFilters}
          otherClasses="min-h-[56px] sm:min-w-[170px]"
          containerClasses="hidden max-md:flex"
        />
      </div>

      <HomeFilters />

      {/* Questions */}
      <div className="mt-10 flex w-full flex-col gap-6">
        {error ? (
          <NoResult
            title="Error loading questions"
            description={error}
            link="/ask-question"
            linkTitle="Ask a Question"
          />
        ) : questions.length > 0 ? (
          questions.map((question: any) => (
            <QuestionCard
              key={question.id}
              _id={question.id}
              title={question.title}
              tags={question.tags || []}
              author={question.author}
              upvotes={question.vote_score || 0}
              views={question.views || 0}
              answers={question.answer_count || 0}
              createdAt={question.created_at}
            />
          ))
        ) : (
          <NoResult
            title="There's no question to show"
            description="Be the first to break the silence! 🚀 Ask a Question and kickstart the discussion. Our query could be the next big thing others learn from. Get involved! 💡"
            link="/ask-question"
            linkTitle="Ask a Question"
          />
        )}
      </div>

      {/* Pagination */}
      {questions.length > 0 && (
        <div className="mt-10">
          <Pagination
            pageNumber={page}
            isNext={isNext}
          />
        </div>
      )}
    </>
  );
}
