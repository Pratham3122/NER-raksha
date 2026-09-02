import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-4">
      <div 
        className={`${sizeClasses[size]} rounded-full border-slate-700 border-t-blue-500 animate-spin`}
      />
      {message && <div className="text-slate-400 text-sm font-semibold">{message}</div>}
    </div>
  );
}
