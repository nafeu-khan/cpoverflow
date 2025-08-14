'use client';

import { useState, useEffect, useMemo } from 'react';
import { UserFilters } from '@/constants/filters';
import LocalSearchbar from '@/components/shared/search/LocalSearchbar';
import Filter from '@/components/shared/Filter';
import Link from 'next/link';
import UserCard from '@/components/cards/UserCard';
import { SearchParamsProps } from '@/types';
import Pagination from '@/components/shared/Pagination';
import apiService from '@/services/apiservices';

const Community = ({ searchParams }: SearchParamsProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNext, setIsNext] = useState(false);

  // Memoize search parameters to prevent unnecessary re-renders
  const searchQuery = useMemo(() => searchParams.q || '', [searchParams.q]);
  const filterValue = useMemo(() => searchParams.filter || '', [searchParams.filter]);
  const pageNumber = useMemo(() => searchParams.page || '', [searchParams.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (filterValue) params.append('sort', filterValue);
      if (pageNumber) params.append('page', pageNumber.toString());

      // Build URL properly to avoid empty query string
      const queryString = params.toString();
      const url = queryString ? `/api/community/users/?${queryString}` : '/api/community/users/';
      
      console.log('Fetching users from URL:', url);
      const response = await apiService.get(url);
      console.log('Users API response:', response);
      
      if (response.results) {
        setUsers(response.results);
        setIsNext(!!response.next);
      } else if (Array.isArray(response)) {
        setUsers(response);
        setIsNext(false);
      } else {
        console.warn('Unexpected response format:', response);
        setUsers([]);
        setIsNext(false);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, filterValue, pageNumber]);

  if (loading) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-dark200_light800">Loading users...</div>
      </div>
    );
  }

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">All Users</h1>

      <div className="mt-11 flex justify-between gap-5 max-sm:flex-col sm:items-center">
        <LocalSearchbar
          route="/community"
          iconPosition="left"
          imgSrc="/assets/icons/search.svg"
          placeholder="Search for amazing minds"
          otherClasses="flex-1"
        />

        <Filter
          filters={UserFilters}
          otherClasses="min-h-[56px] sm:min-w-[170px]"
        />
      </div>

      <section className="mt-12 flex flex-wrap gap-4">
        {users.length > 0 ? (
          users.map((user: any) => (
            <UserCard key={user.user?.id || user.id} user={user} />
          ))
        ) : (
          <div className="paragraph-regular text-dark200_light800 mx-auto max-w-4xl text-center">
            <p>No users yet.</p>
            <Link
              href="/sign-up"
              className="mt-1 font-bold text-accent-blue"
            >
              Join to be the first
            </Link>
          </div>
        )}
      </section>

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
export default Community;
