'use client';

import React, { useState, useRef } from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileSchema } from '@/lib/validations';
import { useRouter } from 'next/navigation';
import apiService from '@/services/apiservices';
import { toast } from '@/components/ui/use-toast';
import { Camera, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  user: string;
  onUserUpdate?: (updatedUser: any) => void;
}

const Profile = ({ user, onUserUpdate }: Props) => {
  const parsedUser = JSON.parse(user);
  const { refreshUser } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(parsedUser.profile_picture || null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  // Define form.
  const form = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: `${parsedUser.first_name || ''} ${parsedUser.last_name || ''}`.trim(),
      username: parsedUser.username || '',
      portfolioWebsite: parsedUser.portfolio_website || '',
      location: parsedUser.address || '',
      bio: parsedUser.bio || '',
      profilePicture: null
    }
  });

  // Handle profile picture change
  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size must be less than 5MB',
          variant: 'destructive'
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please select a valid image file',
          variant: 'destructive'
        });
        return;
      }

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Form Handler.
  async function onSubmit(values: z.infer<typeof ProfileSchema>) {
    setIsSubmitting(true);

    try {
      // Split name into first_name and last_name
      const nameParts = values.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create FormData for file upload support
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('username', values.username);
      formData.append('portfolio_website', values.portfolioWebsite);
      formData.append('address', values.location);
      formData.append('bio', values.bio);

      // Add profile picture if a new one was selected
      if (profileImageFile) {
        formData.append('profile_picture', profileImageFile);
      }

      // Use the authenticated profile endpoint for updating current user  
      const response = await apiService.putFormData('/api/auth/profile/', formData);

      // Update the profile image preview with the new URL from server
      if (response.data && response.data.profile_picture) {
        setProfileImagePreview(response.data.profile_picture);
      }

      // Call the callback to update parent component
      if (onUserUpdate && response.data) {
        onUserUpdate(response.data);
      }

      // Refresh the user data in AuthContext
      await refreshUser();

      toast({
        title: 'Profile updated successfully',
        variant: 'default'
      });

      // Only go back after a short delay to show the updated data
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-9 flex w-full flex-col gap-9"
      >
        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={profileImagePreview || parsedUser.profile_picture || ''} 
                alt="Profile picture"
                key={profileImagePreview || parsedUser.profile_picture || 'no-image'}
              />
              <AvatarFallback className="text-lg">
                {parsedUser.first_name?.charAt(0) || parsedUser.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm">Upload Profile Picture</span>
            </button>
            <p className="text-xs text-gray-500">Max 5MB • JPG, PNG, GIF</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureChange}
            className="hidden"
          />
        </div>

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-3.5">
              <FormLabel className="paragraph-semibold text-dark400_light800">
                Name <span className="text-primary-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Your name"
                  className="no-focus paragraph-regular light-border-2 background-light800_dark300 text-dark300_light700 min-h-[56px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Username */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="space-y-3.5">
              <FormLabel className="paragraph-semibold text-dark400_light800">
                Username <span className="text-primary-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Your username"
                  {...field}
                  className="no-focus paragraph-regular light-border-2 background-light800_dark300 text-dark300_light700 min-h-[56px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Portfolio website */}
        <FormField
          control={form.control}
          name="portfolioWebsite"
          render={({ field }) => (
            <FormItem className="space-y-3.5">
              <FormLabel className="paragraph-semibold text-dark400_light800">
                Portfolio Link{' '}
              </FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="Your portfolio URL"
                  {...field}
                  className="no-focus paragraph-regular light-border-2 background-light800_dark300 text-dark300_light700 min-h-[56px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem className="space-y-3.5">
              <FormLabel className="paragraph-semibold text-dark400_light800">
                Location{' '}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Where are you from?"
                  {...field}
                  className="no-focus paragraph-regular light-border-2 background-light800_dark300 text-dark300_light700 min-h-[56px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem className="space-y-3.5">
              <FormLabel className="paragraph-semibold text-dark400_light800">
                Bio <span className="text-primary-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What's special about you"
                  {...field}
                  className="no-focus paragraph-regular light-border-2 background-light800_dark300 text-dark300_light700 min-h-[56px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-7 flex justify-end">
          <Button
            type="submit"
            className="primary-gradient w-fit !text-light-900"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
export default Profile;
