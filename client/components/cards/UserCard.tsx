import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '../ui/button';
import { useAuth } from '@/context/AuthContext';
import apiService from '@/services/apiservices';

interface Props {
  user: {
    user?: {
      id: string;
      username: string;
      email: string;
      profile_picture?: string;
    };
    id?: string;
    username?: string;
    bio?: string;
    location?: string;
    avatar?: string;
    reputation?: number;
    questions_asked?: number;
    answers_given?: number;
    is_following?: boolean;
    is_mutual_follow?: boolean;
    followers_count?: number;
    following_count?: number;
  };
}

const UserCard = ({ user }: Props) => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(user.is_following || false);
  const [, setIsMutualFollow] = useState(user.is_mutual_follow || false);
  const [followersCount, setFollowersCount] = useState(user.followers_count || 0);
  const [isLoading, setIsLoading] = useState(false);

  // Handle both user profile structure and direct user structure
  const userData = user.user || user;
  const userId = userData.id || user.id;
  const username = userData.username || user.username || 'Unknown User';
  const avatar = (userData as any).profile_picture || user.avatar || '/assets/icons/account.svg';
  const reputation = user.reputation || 0;
  const questionsAsked = user.questions_asked || 0;
  const answersGiven = user.answers_given || 0;

  // Don't show follow button for current user or if not authenticated
  const showFollowButton = isAuthenticated && currentUser?.id !== userId;

  const handleFollowToggle = async () => {
    if (!isAuthenticated || !userId) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await apiService.delete(`/api/community/users/${userId}/follow/`);
        setIsMutualFollow(false); // If we unfollow, it's no longer mutual
      } else {
        // Follow
        await apiService.post(`/api/community/users/${userId}/follow/`, {});
        // Check if they follow us back to update mutual follow status
        // This would normally be returned by the API or we could refetch user data
      }

      setIsFollowing(!isFollowing);
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated || !userId || !isFollowing) return;

    try {
      // Create or get existing chat room with this user
      const response = await apiService.post('/api/chat/rooms/create/', {
        participant_id: userId
      });
      
      if (response.id) {
        // Navigate to chat room or open chat interface
        window.location.href = `/chat/${response.id}`;
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  return (
    <div className="shadow-light100_darknone w-full max-sm:w-full xs:w-[260px]">
      <article className="background-light900_dark200 light-border flex w-full flex-col items-center justify-center rounded-2xl border p-8">
        <Link href={`/profile/${username}`}>
          <Image
            src={avatar}
            alt={username}
            width={100}
            height={100}
            className="rounded-full"
          />
        </Link>

        {/* User info */}
        <Link href={`/profile/${username}`}>
          <div className="mt-4 text-center">
            <h3 className="h3-bold text-dark200_light900 line-clamp-1">
              {username}
            </h3>
            <p className="body-regular text-dark500_light500 mt-2">
              Reputation: {reputation}
            </p>
          </div>
        </Link>

        {/* User Stats */}
        <div className="mt-5 flex w-full flex-col items-center gap-2">
          <div className="flex gap-4 text-xs">
            <span className="text-dark500_light500">
              {questionsAsked} Questions
            </span>
            <span className="text-dark500_light500">
              {answersGiven} Answers
            </span>
          </div>
          
          <div className="flex gap-4 text-xs">
            <span className="text-dark500_light500">
              {followersCount} Followers
            </span>
            <span className="text-dark500_light500">
              {user.following_count || 0} Following
            </span>
          </div>
          
          {user.bio && (
            <p className="body-regular text-dark500_light500 mt-2 text-center line-clamp-2">
              {user.bio}
            </p>
          )}
          
          {user.location && (
            <p className="text-xs text-dark500_light500">
              📍 {user.location}
            </p>
          )}

          {/* Follow and Chat Buttons */}
          {showFollowButton && (
            <div className="mt-3 w-full flex gap-2">
              <Button
                onClick={handleFollowToggle}
                disabled={isLoading}
                className={`flex-1 ${
                  isFollowing 
                    ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
                size="sm"
              >
                {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
              </Button>

              {/* Chat button for users you're following */}
              {isFollowing && (
                <Button
                  onClick={handleStartChat}
                  className="bg-green-500 hover:bg-green-600 text-white px-3"
                  size="sm"
                  title="Start Chat"
                >
                  💬
                </Button>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
};
export default UserCard;
