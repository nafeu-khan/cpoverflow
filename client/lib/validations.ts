import * as z from 'zod';

/**
 * Define the shape of form using a Zod schema.
 * https://zod.dev/
 *
 */

// Auth validation schemas
export const SignInSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters')
});

export const SignUpSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const ResetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const QuestionsSchema = z.object({
  title: z.string().min(5).max(200),
  explanation: z.string().min(10),
  tags: z.array(z.string().min(1).max(15)).min(1).max(3)
});

export const AnswerSchema = z.object({
  answer: z.string().min(5)
});

export const ProfileSchema = z.object({
  name: z.string().min(5).max(50),
  username: z.string().min(5).max(50),
  bio: z.string().min(10).max(150),
  portfolioWebsite: z.string().url(),
  location: z.string().min(5).max(50),
  profilePicture: z.any().optional()
});
