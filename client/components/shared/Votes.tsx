'use client';

import { formatAndDivideNumber } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from '../ui/use-toast';
import apiService from '@/services/apiservices';

interface Props {
  type: string;
  itemId: string;
  userId: string;
  upvotes: number;
  hasUpvoted: boolean;
  downvotes: number;
  hasDownvoted: boolean;
  hasSaved?: boolean;
  onBookmarkChange?: () => void;
}

const Votes = ({
  type,
  itemId,
  userId,
  upvotes,
  hasUpvoted,
  downvotes,
  hasDownvoted,
  hasSaved,
  onBookmarkChange
}: Props) => {
  const [voteState, setVoteState] = useState({
    upvotes,
    downvotes,
    hasUpvoted,
    hasDownvoted,
    hasSaved
  });

  const handleSave = async () => {
    if (!userId) {
      return toast({
        title: 'Please log in',
        description: 'You must be logged in to perform this action'
      });
    }

    try {
      if (voteState.hasSaved) {
        // Remove bookmark using DELETE method
        await apiService.delete(`/api/questions/${itemId}/bookmark/`);
      } else {
        // Add bookmark using POST method
        await apiService.post(`/api/questions/${itemId}/bookmark/`, {
          user_id: userId
        });
      }
      
      setVoteState(prev => ({ ...prev, hasSaved: !prev.hasSaved }));
      
      // Call the callback to refresh the parent component
      if (onBookmarkChange) {
        onBookmarkChange();
      }
      
      return toast({
        title: `Question ${
          !voteState.hasSaved ? 'saved in' : 'removed from'
        } your collection`,
        variant: !voteState.hasSaved ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: 'Error',
        description: 'Failed to save question',
        variant: 'destructive'
      });
    }
  };

  const handleVote = async (action: string) => {
    if (!userId) {
      return toast({
        title: 'Please log in',
        description: 'You must be logged in to perform this action'
      });
    }

    try {
      const endpoint = type === 'Question' 
        ? `/api/questions/${itemId}/vote/`
        : `/api/answers/${itemId}/vote/`;
      
      // Convert frontend action to Django vote_type format
      const voteType = action === 'upvote' ? 'up' : 'down';
      
      await apiService.post(endpoint, {
        vote_type: voteType
      });

      // Update local state based on response
      if (action === 'upvote') {
        setVoteState(prev => ({
          ...prev,
          hasUpvoted: !prev.hasUpvoted,
          hasDownvoted: prev.hasUpvoted ? prev.hasDownvoted : false,
          upvotes: prev.hasUpvoted ? prev.upvotes - 1 : prev.upvotes + 1,
          downvotes: prev.hasDownvoted ? prev.downvotes - 1 : prev.downvotes
        }));
        
        return toast({
          title: `Upvote ${!voteState.hasUpvoted ? 'Successful' : 'Removed'}`,
          variant: !voteState.hasUpvoted ? 'default' : 'destructive'
        });
      }

      if (action === 'downvote') {
        setVoteState(prev => ({
          ...prev,
          hasDownvoted: !prev.hasDownvoted,
          hasUpvoted: prev.hasDownvoted ? prev.hasUpvoted : false,
          downvotes: prev.hasDownvoted ? prev.downvotes - 1 : prev.downvotes + 1,
          upvotes: prev.hasUpvoted ? prev.upvotes - 1 : prev.upvotes
        }));
        
        return toast({
          title: `Downvote ${!voteState.hasDownvoted ? 'Successful' : 'Removed'}`,
          variant: !voteState.hasDownvoted ? 'default' : 'destructive'
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to vote',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex gap-5">
      <div className="flex-center gap-2.5">
        <div className="flex-center gap-1.5">
          <Image
            src={
              voteState.hasUpvoted
                ? '/assets/icons/upvoted.svg'
                : '/assets/icons/upvote.svg'
            }
            alt={voteState.hasUpvoted ? 'upvoted' : 'upvote'}
            width={18}
            height={18}
            className="cursor-pointer"
            onClick={() => handleVote('upvote')}
          />

          <div className="flex-center background-light700_dark400 min-w-[18px] rounded-sm p-1">
            <p className="subtle-medium text-dark400_light900">
              {formatAndDivideNumber(voteState.upvotes)}
            </p>
          </div>
        </div>

        <div className="flex-center gap-1.5">
          <Image
            src={
              voteState.hasDownvoted
                ? '/assets/icons/downvoted.svg'
                : '/assets/icons/downvote.svg'
            }
            alt={voteState.hasDownvoted ? 'downvoted' : 'downvote'}
            width={18}
            height={18}
            className="cursor-pointer"
            onClick={() => handleVote('downvote')}
          />

          <div className="flex-center background-light700_dark400 min-w-[18px] rounded-sm p-1">
            <p className="subtle-medium text-dark400_light900">
              {formatAndDivideNumber(voteState.downvotes)}
            </p>
          </div>
        </div>
      </div>

      {type === 'Question' && (
        <Image
          src={
            voteState.hasSaved
              ? '/assets/icons/star-filled.svg'
              : '/assets/icons/star-red.svg'
          }
          alt={voteState.hasSaved ? 'star-filled' : 'star-red'}
          width={18}
          height={18}
          className="cursor-pointer"
          onClick={handleSave}
        />
      )}
    </div>
  );
};
export default Votes;
