import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { AuthProvider as SanAuthProvider } from '@/modules/auth'

import "../../modules/server";
import { BrowserDetector, ReactErrorBoundary } from '../../modules/detector';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SanPosts AI - Multi-Platform Social Studio',
  description: 'AI-powered social campaign planner and generation engine for LinkedIn, X/Twitter, Instagram, and Facebook.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-zinc-800 selection:text-white dark:selection:bg-zinc-200 dark:selection:text-zinc-950">
        <ReactErrorBoundary>
          <BrowserDetector />
          <ThemeProvider>
            <ToastProvider>
              <SanAuthProvider config={{
                 applicationId: "6aa6d873d1f11024d03ede21", 
                 authUrl: "http://localhost:3001", 
                 clientId:"client_8fd93be327b0124d1349f97ee3258a86",
                 autoRefresh:true }}>
                
                  {children}

              </SanAuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </ReactErrorBoundary>
      </body>
    </html>
  );
}
