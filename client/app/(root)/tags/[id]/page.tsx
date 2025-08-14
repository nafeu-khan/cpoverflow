'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import QuestionCard from '@/components/cards/QuestionCard';
import Filter from '@/components/shared/Filter';
import NoResult from '@/components/shared/NoResult';
import Pagination from '@/components/shared/Pagination';
import LocalSearchbar from '@/components/shared/search/LocalSearchbar';
import { QuestionFilters } from '@/constants/filters';
import { SearchParamsProps } from '@/types';
import apiService from '@/services/apiservices';

interface TagDetailProps extends SearchParamsProps {}

const TagDetail = ({ searchParams }: TagDetailProps) => {
  const params = useParams();
  const tagId = params.id as string;
  
  const [tag, setTag] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNext, setIsNext] = useState(false);

  useEffect(() => {
    const fetchTagAndQuestions = async () => {
      try {
        setLoading(true);
        
        // Fetch tag details and questions with that tag
        const questionParams = new URLSearchParams({
          tags: tagId,
          search: searchParams.q || '',
          filter: searchParams.filter || '',
          page: (searchParams.page || 1).toString()
        });
        
        const [tagResponse, questionsResponse] = await Promise.all([
          apiService.get(`/api/tags/${tagId}/`),
          apiService.get(`/api/questions/?${questionParams}`)
        ]);
        
        console.log('Question API URL:', `/api/questions/?${questionParams}`);
        console.log('Tag response:', tagResponse);
        console.log('Questions response:', questionsResponse);
        console.log('Questions array length:', questionsResponse?.results?.length || questionsResponse?.length || 0);
        
        setTag(tagResponse);
        
        // Handle the response format from backend
        if (questionsResponse.questions) {
          // Backend returns { success: true, questions: [...], isNext: boolean }
          setQuestions(questionsResponse.questions);
          setIsNext(questionsResponse.isNext);
        } else if (questionsResponse.results) {
          // Fallback for paginated response
          setQuestions(questionsResponse.results);
          setIsNext(!!questionsResponse.next);
        } else if (Array.isArray(questionsResponse)) {
          // Direct array response
          setQuestions(questionsResponse);
          setIsNext(false);
        } else {
          setQuestions([]);
          setIsNext(false);
        }
      } catch (error) {
        console.error('Error fetching tag details:', error);
        setTag(null);
        setQuestions([]);
        setIsNext(false);
      } finally {
        setLoading(false);
      }
    };

    if (tagId) {
      fetchTagAndQuestions();
    }
  }, [tagId, searchParams]);

  if (loading) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-dark200_light800">Loading tag details...</div>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-center">
          <h2 className="h2-bold text-dark200_light900 mb-4">Tag Not Found</h2>
          <p className="text-dark400_light800">The tag you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Tag Header */}
      <div className="flex w-full flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="background-light800_dark400 w-fit rounded-sm px-5 py-1.5">
            <p className="paragraph-semibold text-dark300_light900 uppercase">
              {tag.name}
            </p>
          </div>
          <p className="small-medium text-dark400_light500">
            <span className="body-semibold primary-text-gradient mr-2.5">
              {tag.question_count || 0}
            </span>
            Questions
          </p>
        </div>
      </div>

      {/* Tag Description */}
      {tag.description && (
        <div className="mt-6">
          <p className="paragraph-regular text-dark500_light700">
            {tag.description}
          </p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mt-11 flex justify-between gap-5 max-sm:flex-col sm:items-center">
        <LocalSearchbar
          route={`/tags/${tagId}`}
          iconPosition="left"
          imgSrc="/assets/icons/search.svg"
          placeholder="Search questions in this tag"
          otherClasses="flex-1"
        />

        <Filter
          filters={QuestionFilters}
          otherClasses="min-h-[56px] sm:min-w-[170px]"
        />
      </div>

      {/* Questions */}
      <div className="mt-10 flex w-full flex-col gap-6">
        {questions.length > 0 ? (
          questions.map((question: any) => (
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
          ))
        ) : (
          <NoResult
            title={`No questions found for "${tag.name}"`}
            description="Be the first to break the silence! 🚀 Ask a Question and kickstart the discussion. Your query could be the next big thing others learn from. Get involved! 💡"
            link="/ask-question"
            linkTitle="Ask Question"
          />
        )}
      </div>

      {/* Pagination */}
      <div className="mt-10">
        <Pagination
          pageNumber={searchParams?.page ? +searchParams.page : 1}
          isNext={isNext}
        />
      </div>
    </>
  );
};

export default TagDetail;
