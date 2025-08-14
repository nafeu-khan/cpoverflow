'use client';

import { useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { URLProps } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { getJoinedDate } from '@/lib/utils';
import ProfileLink from '@/components/shared/ProfileLink';
import Stats from '@/components/shared/Stats';
import QuestionTab from '@/components/shared/QuestionTab';
import AnswersTab from '@/components/shared/AnswersTab';
import apiService from '@/services/apiservices';
import { useAuth } from '@/context/AuthContext';

const ProfilePage = ({ params, searchParams }: URLProps) => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Use the new profile API endpoint
        const response = await apiService.get(`/api/profiles/${params.id}/`);
        
        setUserInfo({
          user: {
            ...response.user,
            name: response.user.username,
            picture: response.user.profile_picture || response.avatar
          },
          totalQuestions: response.questions_asked || 0,
          totalAnswers: response.answers_given || 0,
          badges: response.badges || [],
          reputation: response.reputation || 0,
          bio: response.bio || '',
          location: response.location || '',
          website: response.website || '',
          github_username: response.github_username || '',
          linkedin_url: response.linkedin_url || '',
          twitter_username: response.twitter_username || '',
          followers_count: response.followers_count || 0,
          following_count: response.following_count || 0,
          best_answers: response.best_answers || 0,
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
        setUserInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [params.id, currentUser, isAuthenticated]);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!userInfo) {
    return <div>User not found</div>;
  }

  const isOwnProfile = isAuthenticated && currentUser && currentUser.username === params.id;

  return (
    <>
      <div className="flex w-full flex-col-reverse items-start justify-between sm:flex-row">
        <div className="flex flex-col items-start gap-4 lg:flex-row">
          <Image
            src={userInfo?.user.picture || '/assets/icons/avatar.svg'}
            alt="profile picture"
            width={140}
            height={140}
            className="rounded-full object-cover"
          />

          <div className="mt-3">
            <h2 className="h2-bold text-dark100_light900">
              {userInfo?.user.name}
            </h2>
            <p className="paragraph-regular text-dark200_light800">
              @{userInfo?.user.username || userInfo?.user.name?.toLowerCase().replace(/\s+/g, '')}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-start gap-5">
              {userInfo?.website && (
                <ProfileLink
                  imgUrl="/assets/icons/link.svg"
                  href={userInfo.website}
                  title="Portfolio"
                />
              )}

              {userInfo?.location && (
                <ProfileLink
                  imgUrl="/assets/icons/location.svg"
                  title={userInfo.location}
                />
              )}

              <ProfileLink
                imgUrl="/assets/icons/calendar.svg"
                title={getJoinedDate(userInfo?.user.date_joined)}
              />
            </div>

            {userInfo?.bio && (
              <p className="paragraph-regular text-dark400_light800 mt-8">
                {userInfo.bio}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end max-sm:mb-5 max-sm:w-full sm:mt-3">
          {isOwnProfile && (
            <Link href="/profile/edit">
              <Button className="paragraph-medium btn-secondary text-dark300_light900 min-h-[46px] min-w-[175px] px-4 py-3">
                Edit Profile
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Stats
        reputation={userInfo?.reputation || 0}
        totalQuestions={userInfo?.totalQuestions || 0}
        totalAnswers={userInfo?.totalAnswers || 0}
        badges={userInfo?.badges || []}
      />

      <div className="mt-10 flex gap-10">
        <Tabs defaultValue="top-posts" className="flex-1">
          <TabsList className="background-light800_dark400 min-h-[42px] p-1">
            <TabsTrigger value="top-posts" className="tab">
              Top Posts
            </TabsTrigger>
            <TabsTrigger value="answers" className="tab">
              Answers
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="top-posts"
            className="mt-5 flex w-full flex-col gap-6"
          >
            <QuestionTab
              searchParams={searchParams}
              userId={params.id}
            />
          </TabsContent>

          <TabsContent value="answers" className="flex w-full flex-col gap-6">
            <AnswersTab
              searchParams={searchParams}
              userId={params.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ProfilePage;
// } from '@/components/ui/tabs';

// import { Button } from '@/components/ui/button';
// import { getUserInfo } from '@/lib/(move)actions/user.action';
// import { URLProps } from '@/types';
// import { SignedIn, auth } from '@clerk/nextjs';
// import Image from 'next/image';
// import Link from 'next/link';
// import { getJoinedDate } from '@/lib/utils';
// import ProfileLink from '@/components/shared/ProfileLink';
// import Stats from '@/components/shared/Stats';
// import QuestionTab from '@/components/shared/QuestionTab';
// import AnswersTab from '@/components/shared/AnswersTab';

// const ProfilePage = async ({ params, searchParams }: URLProps) => {
//   const { userId: clerkId } = auth();
//   const userInfo = await getUserInfo({ userId: params.id });

//   return (
//     <>
//       <div className="flex w-full flex-col-reverse items-start justify-between sm:flex-row">
//         <div className="flex flex-col items-start gap-4 lg:flex-row">
//           <Image
//             src={userInfo?.user.picture}
//             alt="profile picture"
//             width={140}
//             height={140}
//             className="rounded-full object-cover"
//           />

//           <div className="mt-3">
//             <h2 className="h2-bold text-dark100_light900">
//               {userInfo.user.name}
//             </h2>
//             <p className="paragraph-regular text-dark200_light800">
//               @{userInfo.user.username}
//             </p>

//             <div className="mt-5 flex flex-wrap items-center justify-start gap-5">
//               {/* Location */}
//               {userInfo.user.location && (
//                 <ProfileLink
//                   imgUrl="/assets/icons/location.svg"
//                   title={userInfo.user.location}
//                 />
//               )}

//               {/* Portfolio Website */}
//               {userInfo.user.portfolioWebsite && (
//                 <ProfileLink
//                   imgUrl="/assets/icons/link.svg"
//                   href={userInfo.user.portfolioWebsite}
//                   title="Portfolio"
//                 />
//               )}

//               {/* Joined Date */}
//               <ProfileLink
//                 imgUrl="/assets/icons/calendar.svg"
//                 title={getJoinedDate(userInfo.user.joinedAt)}
//               />
//             </div>

//             {/* Bio */}
//             {userInfo.user.bio && (
//               <p className="paragraph-regular text-dark400_light800 mt-8">
//                 {userInfo.user.bio}
//               </p>
//             )}
//           </div>
//         </div>

//         <div className="flex justify-end max-sm:mb-5 max-sm:w-full sm:mt-3">
//           <SignedIn>
//             {clerkId === userInfo.user.clerkId && (
//               <Link href="/profile/edit">
//                 <Button className="paragraph-medium btn-secondary text-dark300_light900 min-h-[46px] px-4 py-3">
//                   Edit profile
//                 </Button>
//               </Link>
//             )}
//           </SignedIn>
//         </div>
//       </div>

//       <Stats
//         reputation={userInfo.reputation}
//         totalQuestions={userInfo.totalQuestions}
//         totalAnswers={userInfo.totalAnswers}
//         badges={userInfo.badgeCounts}
//       />

//       <div className="mt-10 flex gap-10">
//         <Tabs defaultValue="top-posts" className="flex-1">
//           <TabsList className="background-light800_dark400 min-h-[42px] p-1">
//             <TabsTrigger value="top-posts" className="tab">
//               Top posts
//             </TabsTrigger>
//             <TabsTrigger value="answers" className="tab">
//               Answers
//             </TabsTrigger>
//           </TabsList>

//           {/* TOP POSTS */}
//           <TabsContent
//             value="top-posts"
//             className="flex w-full flex-col gap-6"
//           >
//             <QuestionTab
//               searchParams={searchParams}
//               userId={userInfo.user._id}
//               clerkId={clerkId}
//             />
//           </TabsContent>
//           {/* ANSWERS */}
//           <TabsContent
//             value="answers"
//             className="flex w-full flex-col gap-6"
//           >
//             <AnswersTab
//               searchParams={searchParams}
//               userId={userInfo.user._id}
//               clerkId={clerkId}
//             />
//           </TabsContent>
//         </Tabs>
//       </div>
//     </>
//   );
// };
// export default ProfilePage;
