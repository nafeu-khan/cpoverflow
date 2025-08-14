'use client';

import { useState, useEffect } from 'react';
import { AnswerFilters } from '@/constants/filters';
import Filter from './Filter';
import Link from 'next/link';
import Image from 'next/image';
import { getTimestamp } from '@/lib/utils';
import ParseHTML from './ParseHTML';
import Votes from './Votes';
import Pagination from './Pagination';
import apiService from '@/services/apiservices';

interface Props {
  questionId: string;
  userId: string;
  totalAnswers: number;
  page?: number;
  filter?: string;
}

const AllAnswers = ({
  questionId,
  userId,
  totalAnswers,
  page,
  filter
}: Props) => {
  const [result, setResult] = useState<any>({ answers: [], isNext: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        const response = await apiService.get(`/api/answers/question/${questionId}/?${new URLSearchParams({
          page: (page || 1).toString(),
          sort_by: filter || ''
        })}`);
        
        if (response.success) {
          setResult({
            answers: response.answers || [],
            isNext: response.isNext || false
          });
        } else {
          setResult({ answers: [], isNext: false });
        }
      } catch (error) {
        console.error('Error fetching answers:', error);
        setResult({ answers: [], isNext: false });
      } finally {
        setLoading(false);
      }
    };

    fetchAnswers();
  }, [questionId, page, filter]);

  if (loading) {
    return <div>Loading answers...</div>;
  }

  return (
    <div className="mt-11">
      <div className="flex items-center justify-between">
        <h3 className="primary-text-gradient">{totalAnswers} Answers</h3>

        <Filter filters={AnswerFilters} />
      </div>

      <div>
        {result.answers.map((answer: any) => (
          <article
            key={answer.id}
            className="light-border border-b py-10"
          >
            {/* Span Id Identifier */}
            <div className="mb-8 flex w-full justify-between gap-5 sm:flex-row sm:items-center sm:gap-2">
              <Link
                href={`/profile/${answer.author.id}`}
                className="flex flex-1 items-start gap-1 sm:items-center"
              >
                <Image
                  src={answer.author.picture || '/assets/icons/avatar.svg'}
                  alt="profile"
                  width={18}
                  height={18}
                  className="rounded-full object-cover max-sm:mt-0.5"
                />
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <p className="body-semibold text-dark300_light700">
                    {answer.author.name}
                  </p>

                  <p className="small-regular text-light400_light500 ml-1 mt-0.5 line-clamp-1">
                    - answered {getTimestamp(answer.created_at)}
                  </p>
                </div>
              </Link>

              <div className="flex justify-end">
                <Votes
                  type="Answer"
                  itemId={answer?.id}
                  userId={userId}
                  upvotes={answer?.upvotes || 0}
                  hasUpvoted={answer?.user_vote === 'up'}
                  downvotes={answer?.downvotes || 0}
                  hasDownvoted={answer?.user_vote === 'down'}
                />
              </div>
            </div>

            <ParseHTML data={answer.content} />
          </article>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-10 w-full">
        <Pagination pageNumber={page ? +page : 1} isNext={result.isNext} />
      </div>
    </div>
  );
};
export default AllAnswers;
