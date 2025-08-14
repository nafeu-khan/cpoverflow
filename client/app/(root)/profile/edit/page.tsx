'use client';

import { useState, useEffect } from 'react';
import Profile from '@/components/forms/Profile';
import { ParamsProps } from '@/types';
import apiService from '@/services/apiservices';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const EditProfile = ({ params }: ParamsProps) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();
  const router = useRouter();

  const fetchUser = async () => {
    try {
      // Use the authenticated profile endpoint for editing profile
      const response = await apiService.get('/api/auth/profile/');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    fetchUser();
  }, [isAuthenticated, router]);

  // Handle user update from Profile form
  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <>
      <h1 className="h1-bold text-dark100_light900 ">Edit Profile</h1>

      <div className="mt-9">
        <Profile
          user={JSON.stringify(user)}
          onUserUpdate={handleUserUpdate}
        />
      </div>
    </>
  );
};

export default EditProfile;
