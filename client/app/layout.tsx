/* eslint-disable camelcase */
import React from 'react';
import { Inter, Space_Grotesk } from 'next/font/google';
import type { Metadata } from 'next';

import './globals.css';
import '../styles/prism.css';
import { ThemeProvider } from '@/context/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter'
});
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-spaceGrotesk'
});

export const metadata: Metadata = {
  title: 'CPOverflow',
  description:
    'A community-driven platform for asking and answering programming questions. Get help, share knowledge, and collaborate with programmers from around the world.',
  icons: '/assets/images/site-logo.svg',
  openGraph: {
    images: '/assets/meta.jpeg'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>   
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
