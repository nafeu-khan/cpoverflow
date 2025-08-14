'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import RenderTag from './RenderTag';
import apiService from '@/services/apiservices';

interface Question {
  id: string;
  title: string;
}

interface Tag {
  id: string;
  name: string;
  question_count: number;
}

const RightSidebar = () => {
  const [hotQuestions, setHotQuestions] = useState<Question[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        setLoading(true);
        
        // Fetch trending questions and popular tags in parallel
        const [questionsResponse, tagsResponse] = await Promise.all([
          apiService.get('/api/questions/trending/'),
          apiService.get('/api/tags/?sort=popular&limit=5')
        ]);

        // Set hot questions
        if (questionsResponse.results) {
          setHotQuestions(questionsResponse.results.slice(0, 5));
        }

        // Set popular tags
        if (tagsResponse.tags) {
          setPopularTags(tagsResponse.tags);
        }
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
        // Keep empty arrays as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchSidebarData();
  }, []);

  return (
    <aside className="background-light900_dark200 light-border custom-scrollbar no-scrollbar sticky right-0 top-0 flex h-screen w-[350px] flex-col overflow-y-auto border-l p-6 pt-36 shadow-light-300 dark:shadow-none max-xl:hidden">
      {/* Top questions */}
      <div>
        <h3 className="h3-bold text-dark200_light900">Top Questions</h3>
        {loading ? (
          <div className="mt-7 flex w-full flex-col gap-[30px]">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-7">
                <div className="h-4 bg-gray-300 rounded animate-pulse flex-1"></div>
                <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-7 flex w-full flex-col gap-[30px]">
            {hotQuestions.length > 0 ? (
              hotQuestions.map((question) => (
                <Link
                  key={question.id}
                  href={`/question/${question.id}`}
                  className="flex cursor-pointer items-center justify-between gap-7"
                >
                  <p className="body-medium text-dark500_light700">
                    {question.title}
                  </p>
                  <Image
                    src="/assets/icons/chevron-right.svg"
                    alt="chevron right"
                    width={20}
                    height={20}
                    className="invert-colors"
                  />
                </Link>
              ))
            ) : (
              <p className="text-dark500_light700 text-sm">No trending questions found.</p>
            )}
          </div>
        )}
      </div>

      {/* Popular tags */}
      <div className="mt-16">
        <h3 className="h3-bold text-dark200_light900">Popular Tags</h3>
        {loading ? (
          <div className="mt-7 flex flex-col gap-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-8 bg-gray-300 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="mt-7 flex flex-col gap-4">
            {popularTags.length > 0 ? (
              popularTags.map((tag) => (
                <RenderTag
                  key={tag.id}
                  _id={tag.id}
                  name={tag.name}
                  totalQuestions={tag.question_count}
                  showCount
                />
              ))
            ) : (
              <p className="text-dark500_light700 text-sm">No popular tags found.</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;
