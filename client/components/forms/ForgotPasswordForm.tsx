'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/apiservices';

type ForgotPasswordFormValues = {
  email: string;
};

const ForgotPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      const body = JSON.stringify({
        email: data.email,
        base_url: `${window.location.origin}/reset-password`,
      });
      
      const response = await apiService.postWithoutToken('/api/auth/forgot-password/', body);

      if (response.success) {
        setEmailSent(true);
        toast({
          title: "Email Sent!",
          description: response.message || "Password reset email sent. Please check your email.",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to send reset email. Please try again.",
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

  if (emailSent) {
    return (
      <div className="w-full max-w-md space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
          <p className="mt-2 text-sm text-gray-600">
            We&apos;ve sent a password reset link to your email address.
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
          
          <Button
            onClick={() => setEmailSent(false)}
            variant="outline"
            className="w-full"
          >
            Try Again
          </Button>
          
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
        <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
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
            {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPasswordForm;
