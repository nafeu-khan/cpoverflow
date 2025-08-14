'use client';

import Link from 'next/link';
import Metric from '../shared/Metric';
import { formatAndDivideNumber, getTimestamp } from '@/lib/utils';
import EditDeleteAction from '../shared/EditDeleteAction';
import { useAuth } from '@/context/AuthContext';

interface Props {
  _id: string;
  question?: {
    id: string;
    title: string;
  };
  author: {
    id: string;
    name: string;
    picture?: string;
  };
  upvotes: number;
  createdAt: Date;
}

const AnswerCard = ({
  _id,
  question,
  author,
  upvotes,
  createdAt
}: Props) => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const showActionButtons = isAuthenticated && currentUser && currentUser.id === author.id;

  // Handle cases where question data might be missing
  if (!question) {
    return (
      <div className="card-wrapper rounded-[10px] px-11 py-9">
        <div className="flex flex-col-reverse items-start justify-between gap-5 sm:flex-row">
          <div>
            <span className="subtle-regular text-dark400_light700 line-clamp-1 flex sm:hidden">
              {getTimestamp(createdAt)}
            </span>
            <h3 className="sm:h3-semibold base-semibold text-dark200_light900 line-clamp-1 flex-1">
              Answer (Question data unavailable)
            </h3>
          </div>
          {showActionButtons && (
            <EditDeleteAction type="Answer" itemId={_id} />
          )}
        </div>
        {/* Metric components */}
        <div className="flex-center mt-6 w-full flex-wrap gap-3">
          <Metric
            imgUrl="/assets/icons/like.svg"
            alt="upvotes"
            value={formatAndDivideNumber(upvotes)}
            title=" Votes"
            textStyle="small-medium text-dark400_light800"
          />
          <Metric
            imgUrl="/assets/icons/clock.svg"
            alt="clock icon"
            value={getTimestamp(createdAt)}
            title=" Asked"
            textStyle="small-medium text-dark400_light800"
          />
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/question/${question.id}/#${_id}`}
      className="card-wrapper rounded-[10px] px-11 py-9"
    >
      <div className="flex flex-col-reverse items-start justify-between gap-5 sm:flex-row">
        <div>
          <span className="subtle-regular text-dark400_light700 line-clamp-1 flex sm:hidden">
            {getTimestamp(createdAt)}
          </span>
          <h3 className="sm:h3-semibold base-semibold text-dark200_light900 line-clamp-1 flex-1">
            {question.title}
          </h3>
        </div>

        {showActionButtons && (
          <EditDeleteAction type="Answer" itemId={_id} />
        )}
      </div>

      <div className="flex-between mt-6 w-full flex-wrap gap-3">
        <Metric
          imgUrl={author.picture || '/assets/icons/avatar.svg'}
          alt="user avatar"
          value={author.name}
          title={` • asked ${getTimestamp(createdAt)}`}
          href={`/profile/${author.id}`}
          textStyle="body-medium text-dark400_light700"
          isAuthor
        />

        <div className="flex-center gap-3">
          <Metric
            imgUrl="/assets/icons/like.svg"
            alt="like icon"
            value={formatAndDivideNumber(upvotes)}
            title=" Votes"
            textStyle="small-medium text-dark400_light800"
          />
        </div>
      </div>
    </Link>
  );
};

export default AnswerCard;
