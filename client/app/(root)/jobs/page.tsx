'use client';

import { useState, useEffect } from 'react';
import JobCard from '@/components/cards/JobCard';
import JobsFilter from '@/components/jobs/JobsFilter';
import Pagination from '@/components/shared/Pagination';
import apiService from '@/services/apiservices';
import { Job, Country } from '@/types';

interface Props {
  searchParams: {
    q: string;
    location: string;
    page: string;
  };
}

const JobsPage = ({ searchParams }: Props) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState('');

  useEffect(() => {
    const fetchJobsData = async () => {
      try {
        // Fetch user location (mock implementation)
        setUserLocation('United States');

        // Fetch jobs
        const jobsResponse = await apiService.get(`/api/jobs/?${new URLSearchParams({
          q: searchParams.q || `Software Engineer in ${userLocation}`,
          location: searchParams.location || '',
          page: searchParams.page || '1'
        })}`);
        
        setJobs(jobsResponse.data.results || []);

        // Fetch countries (mock data for now)
        setCountries([
          { name: { common: 'United States' } },
          { name: { common: 'Canada' } },
          { name: { common: 'United Kingdom' } },
          { name: { common: 'Germany' } },
          { name: { common: 'France' } }
        ]);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobsData();
  }, [searchParams, userLocation]);

  const page = parseInt(searchParams.page || '1');

  if (loading) {
    return <div>Loading jobs...</div>;
  }

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Jobs</h1>

      <div className="flex">
        <JobsFilter countriesList={countries} />
      </div>

      <section className="light-border mb-9 mt-11 flex flex-col gap-9 border-b pb-9">
        {jobs.length > 0 ? (
          jobs.map((job: Job) => {
            if (
              job.job_title &&
              job.job_title.toLowerCase() !== 'undefined'
            )
              return <JobCard key={job.id} job={job} />;

            return null;
          })
        ) : (
          <div className="paragraph-regular text-dark200_light800 w-full text-center">
            Oops! We couldn&apos;t find any jobs at the moment. Please try
            again later
          </div>
        )}
      </section>

      {jobs.length > 0 && (
        <Pagination pageNumber={page} isNext={jobs.length === 10} />
      )}
    </>
  );
};

export default JobsPage;
