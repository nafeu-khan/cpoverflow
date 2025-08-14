'use client';

import { useState, useEffect } from 'react';
import Answer from '@/components/forms/Answer';
import AllAnswers from '@/components/shared/AllAnswers';
import Metric from '@/components/shared/Metric';
import ParseHTML from '@/components/shared/ParseHTML';
import RenderTag from '@/components/shared/RenderTag';
import Votes from '@/components/shared/Votes';
import AIAnswer from '@/components/shared/AIAnswer';
import { formatAndDivideNumber, getTimestamp } from '@/lib/utils';
import { URLProps } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import apiService from '@/services/apiservices';
import { useAuth } from '@/context/AuthContext';

const QuestionDetail = ({ params, searchParams }: URLProps) => {
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        setLoading(true);
        // Fetch question details
        const questionResponse = await apiService.get(`/api/questions/${params.id}/`);
        
        if (questionResponse.success && questionResponse.data) {
          setQuestion(questionResponse.data);
        } else {
          setError(questionResponse.error || 'Question not found');
        }
      } catch (error: any) {
        console.error('Error fetching question:', error);
        setError(`Failed to load question: ${error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-dark400_light800">Loading question...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <h2 className="h2-bold text-dark200_light900 mb-4">Question Not Found</h2>
          <p className="text-dark400_light800 mb-6">{error || 'The question you are looking for does not exist.'}</p>
          <Link href="/" className="primary-gradient rounded-lg px-6 py-3 text-light-900">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-start w-full flex-col">
        <div className="flex w-full flex-col-reverse justify-between gap-5 sm:flex-row sm:items-center sm:gap-2">
          <Link
            href={`/profile/${question.author.id}`}
            className="flex items-center justify-start gap-1"
          >
            <Image
              src={question.author.profile_picture || '/assets/icons/avatar.svg'}
              alt={question.author.username}
              width={22}
              height={22}
              className="rounded-full"
            />
            <p className="paragraph-semibold text-dark300_light700">
              {question.author.username}
            </p>
          </Link>

          <div className="flex justify-end">
            <Votes
              type="Question"
              itemId={question.id}
              userId={currentUser?.id || ''}
              upvotes={question.upvotes || 0}
              hasUpvoted={question.user_vote === 'up'}
              downvotes={question.downvotes || 0}
              hasDownvoted={question.user_vote === 'down'}
              hasSaved={question.is_bookmarked || false}
            />
          </div>
        </div>

        <h2 className="h2-semibold text-dark200_light900 mt-3.5 w-full text-left">
          {question.title}
        </h2>
      </div>

      <div className="mb-8 mt-5 flex flex-wrap gap-4">
        {/* Votes */}
        <Metric
          imgUrl="/assets/icons/clock.svg"
          alt="clock icon"
          value={` asked ${getTimestamp(question.created_at)}`}
          title="Asked"
          textStyle="small-medium text-dark400_light800"
        />

        {/* Message */}
        <Metric
          imgUrl="/assets/icons/message.svg"
          alt="message"
          value={formatAndDivideNumber(question.answers?.length || 0)}
          title="Answers"
          textStyle="small-medium text-dark400_light800"
        />

        {/* Views */}
        <Metric
          imgUrl="/assets/icons/eye.svg"
          alt="eye"
          value={formatAndDivideNumber(question.views || 0)}
          title="Views"
          textStyle="small-medium text-dark400_light800"
        />
      </div>

      {/* Question content */}
      <ParseHTML data={question.content} />

      {/* AI Answer Component */}
      <div className="mt-8">
        <AIAnswer 
          questionTitle={question.title}
          questionContent={question.content}
          questionTags={question.tags?.map((tag: any) => tag.name) || []}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {question.tags?.map((tag: any) => (
          <RenderTag
            key={tag.id}
            _id={tag.id}
            name={tag.name}
            showCount={false}
          />
        ))}
      </div>

      <AllAnswers
        questionId={question.id}
        userId={currentUser?.id || ''}
        totalAnswers={question.answer_count || 0}
        page={searchParams?.page ? +searchParams.page : 1}
        filter={searchParams?.filter}
      />

      <Answer
        question={question.content}
        questionId={question.id}
        authorId={currentUser?.id || ''}
      />
    </>
  );
};

export default QuestionDetail;
