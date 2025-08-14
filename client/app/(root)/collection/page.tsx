'use client';

import { useState, useEffect } from 'react';
import QuestionCard from '@/components/cards/QuestionCard';
import Filter from '@/components/shared/Filter';
import NoResult from '@/components/shared/NoResult';
import Pagination from '@/components/shared/Pagination';
import LocalSearchbar from '@/components/shared/search/LocalSearchbar';
import { QuestionFilters } from '@/constants/filters';
import { SearchParamsProps } from '@/types';
import apiService from '@/services/apiservices';
import { useAuth } from '@/context/AuthContext';

export default function Collection({
  searchParams
}: SearchParamsProps) {
  const [result, setResult] = useState<any>({ results: [], next: null });
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const fetchSavedQuestions = async () => {
    if (!isAuthenticated || !user) {
      setResult({ results: [], next: null });
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (searchParams.q) params.append('search', searchParams.q);
      if (searchParams.filter) params.append('filter', searchParams.filter);
      if (searchParams.page) params.append('page', searchParams.page.toString());

      const queryString = params.toString();
      const url = queryString ? `/api/questions/my-bookmarks/?${queryString}` : '/api/questions/my-bookmarks/';
      
      console.log('Fetching bookmarks from:', url);
      const response = await apiService.get(url);
      console.log('Bookmarks response:', response);
      
      // Handle paginated response structure
      setResult({
        results: response.results || [],
        next: response.next
      });
    } catch (error) {
      console.error('Error fetching saved questions:', error);
      setResult({ results: [], next: null });
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkChange = () => {
    // Refresh the bookmarks list when a bookmark is removed
    fetchSavedQuestions();
  };

  useEffect(() => {
    fetchSavedQuestions();
  }, [searchParams, isAuthenticated, user]);

  if (loading) {
    return <div>Loading saved questions...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-dark200_light800">Please log in to view your saved questions.</div>
      </div>
    );
  }

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Saved Questions</h1>

      <div className="mt-11 flex justify-between gap-5 max-sm:flex-col sm:items-center">
        <LocalSearchbar
          route="/collection"
          iconPosition="left"
          imgSrc="/assets/icons/search.svg"
          placeholder="Search for questions"
          otherClasses="flex-1"
        />

        <Filter
          filters={QuestionFilters}
          otherClasses="min-h-[56px] sm:min-w-[170px]"
        />
      </div>

      {/* Questions */}
      <div className="mt-10 flex w-full flex-col gap-6">
        {result.results.length > 0 ? (
          result.results.map((question: any) => (
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
              showBookmark={true}
              isBookmarked={question.is_bookmarked || true}
              onBookmarkChange={handleBookmarkChange}
            />
          ))
        ) : (
          <NoResult
            title="There's no saved question to show"
            description="Be the first to break the silence! 🚀 Ask a Question and kickstart
                          the discussion. our query could be the next big thing others learn
                          from. Get involved! 💡"
            link="/ask-question"
            linkTitle="Ask Question"
          />
        )}
      </div>

      {/* Pagination */}
      <div className="mt-10">
        <Pagination
          pageNumber={searchParams?.page ? +searchParams.page : 1}
          isNext={!!result.next}
        />
      </div>
    </>
  );
}
