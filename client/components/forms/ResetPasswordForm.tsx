'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetPasswordSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/apiservices';

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!uid || !token) {
      toast({
        title: "Error",
        description: "Invalid or missing reset parameters. Please request a new password reset.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const body = JSON.stringify({
        uid,
        token,
        new_password: data.password,
      });
      
      const response = await apiService.postWithoutToken('/api/auth/reset-password/', body);

      if (response.success !== false && response.message) {
        setResetSuccess(true);
        toast({
          title: "Success!",
          description: response.message || "Password reset successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to reset password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="w-full max-w-md space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Password Reset Successfully</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your password has been updated. You can now sign in with your new password.
          </p>
        </div>
        
        <Button
          onClick={() => router.push('/sign-in')}
          className="w-full"
        >
          Go to Sign In
        </Button>
      </div>
    );
  }

  if (!uid || !token) {
    return (
      <div className="w-full max-w-md space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h1>
          <p className="mt-2 text-sm text-gray-600">
            This password reset link is invalid or has expired.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link href="/forgot-password" className="block">
            <Button className="w-full">
              Request New Reset Link
            </Button>
          </Link>
          
          <Link href="/sign-in" className="block">
            <Button variant="ghost" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link href="/sign-in" className="text-blue-600 hover:text-blue-500 font-medium">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default ResetPasswordForm;
