'use client';

import React from 'react';
import { Logo } from '../brand/Logo';

interface EmptyChatStateProps {
  headline?: string;
  description?: string;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({
  headline = 'What would you like to create?',
  description = "Describe your campaign topic or attach an image. We'll craft platform-tailored posts ready to publish.",
}) => {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center px-4 mb-6 animate-in fade-in duration-200">
      {/* Brand Logo */}
      <div className="mb-4">
        <Logo size="lg" showText={false} />
      </div>

      {/* Main Headline */}
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-zinc-50 mb-2.5">
        {headline}
      </h1>

      {/* Subheading / Description */}
      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
        {description}
      </p>
    </div>
  );
};
