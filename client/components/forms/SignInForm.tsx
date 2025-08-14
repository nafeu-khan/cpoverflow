'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignInSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

type SignInFormValues = {
  username: string;
  password: string;
};

const SignInForm = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    setLoading(true);
    try {
      const result = await login(data.username, data.password);
      
      if (result.success) {
        toast({
          title: "Success!",
          description: "You have been signed in successfully.",
        });
        router.push('/');
      } else {
        toast({
          title: "Error",
          description: result.error || "Sign in failed. Please try again.",
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

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back! Please sign in to your account.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your username"
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
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
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>

      <div className="text-center space-y-2">
        <Link
          href="/forgot-password"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Forgot your password?
        </Link>
        
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-blue-600 hover:text-blue-500 font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignInForm;
