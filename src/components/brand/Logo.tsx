'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const dimensions = {
    sm: { box: 'w-7 h-7', icon: 18, text: 'text-xs', badge: 'text-[9px]' },
    md: { box: 'w-9 h-9', icon: 22, text: 'text-sm', badge: 'text-[10px]' },
    lg: { box: 'w-12 h-12', icon: 28, text: 'text-lg', badge: 'text-xs' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Sleek SVG Symbol: Stylized interlocking "S" with broadcast signal nodes */}
      <div
        className={`${dimensions.box} rounded-xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center shadow-md shadow-indigo-950/20 relative overflow-hidden group shrink-0`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/30 to-violet-500/20 opacity-80 group-hover:opacity-100 transition-opacity" />
        <svg
          width={dimensions.icon}
          height={dimensions.icon}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 text-white"
        >
          {/* Top curve */}
          <path
            d="M23 10.5C23 7.46 20.31 5 17 5H11C7.69 5 5 7.46 5 10.5C5 13.54 7.69 16 11 16H21C24.31 16 27 18.46 27 21.5C27 24.54 24.31 27 21 27H15C11.69 27 9 24.54 9 21.5"
            stroke="url(#logo_grad_1)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Pulsing signal nodes */}
          <circle cx="21" cy="10.5" r="2.5" fill="#818cf8" />
          <circle cx="11" cy="21.5" r="2.5" fill="#6366f1" />
          <circle cx="25" cy="5" r="1.5" fill="#c7d2fe" />

          <defs>
            <linearGradient id="logo_grad_1" x1="5" y1="5" x2="27" y2="27" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="0.5" stopColor="#818cf8" />
              <stop offset="1" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-foreground dark:text-white ${dimensions.text}`}
            >
              SanPosts
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold ${dimensions.badge}`}
            >
              AI
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
