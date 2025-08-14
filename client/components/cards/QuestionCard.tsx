import React from 'react';
import Link from 'next/link';
import RenderTag from '@/components/shared/RenderTag';
import Metric from '@/components/shared/Metric';
import Votes from '@/components/shared/Votes';
import { formatAndDivideNumber, getTimestamp } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface Author {
  id: string;
  username: string;
  profile_picture?: string;
}

interface Tag {
  id: string;
  name: string;
}

interface QuestionCardProps {
  _id: string;
  title: string;
  tags: Tag[];
  author: Author;
  upvotes: number;
  views: number;
  answers: number;
  createdAt: string;
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onBookmarkChange?: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  _id,
  title,
  tags,
  author,
  upvotes,
  views,
  answers,
  createdAt,
  showBookmark = false,
  isBookmarked = false,
  onBookmarkChange
}) => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="card-wrapper rounded-[10px] p-9 sm:px-11">
      <div className="flex flex-col-reverse items-start justify-between gap-5 sm:flex-row">
        <div className="flex-1">
          <span className="subtle-regular text-dark400_light700 line-clamp-1 flex sm:hidden">
            {getTimestamp(createdAt)}
          </span>
          <Link href={`/question/${_id}`}>
            <h3 className="sm:h3-semibold base-semibold text-dark200_light900 line-clamp-1 flex-1">
              {title}
            </h3>
          </Link>
        </div>

        {/* Bookmark button for collection page */}
        {showBookmark && isAuthenticated && (
          <div className="flex-shrink-0">
            <Votes
              type="Question"
              itemId={_id}
              userId={user?.id || ''}
              upvotes={upvotes}
              hasUpvoted={false}
              downvotes={0}
              hasDownvoted={false}
              hasSaved={isBookmarked}
              onBookmarkChange={onBookmarkChange}
            />
          </div>
        )}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <RenderTag key={tag.id} _id={tag.id} name={tag.name} />
        ))}
      </div>

      <div className="flex-between mt-6 w-full flex-wrap gap-3">
        <Metric
          imgUrl={author.profile_picture || '/assets/icons/avatar.svg'}
          alt="user"
          value={author.username}
          title={` • asked ${getTimestamp(createdAt)}`}
          href={`/profile/${author.id}`}
          isAuthor
          textStyle="body-medium text-dark400_light700"
        />

        <div className="flex items-center gap-3 max-sm:flex-wrap max-sm:justify-start">
          <Metric
            imgUrl="/assets/icons/like.svg"
            alt="Upvotes"
            value={formatAndDivideNumber(upvotes)}
            title=" Votes"
            textStyle="small-medium text-dark400_light800"
          />
          <Metric
            imgUrl="/assets/icons/message.svg"
            alt="message"
            value={formatAndDivideNumber(answers)}
            title=" Answers"
            textStyle="small-medium text-dark400_light800"
          />
          <Metric
            imgUrl="/assets/icons/eye.svg"
            alt="eye"
            value={formatAndDivideNumber(views)}
            title=" Views"
            textStyle="small-medium text-dark400_light800"
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;