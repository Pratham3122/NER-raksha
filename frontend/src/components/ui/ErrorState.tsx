import React from 'react';

interface ErrorStateProps {
  message: string;
  retry?: () => void;
}

export default function ErrorState({ message, retry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-red-900/50 bg-red-950/20 rounded-sm space-y-4 max-w-md mx-auto mt-8 text-center">
      <div className="text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div className="text-slate-200 font-semibold">{message}</div>
      {retry && (
        <button 
          onClick={retry}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-sm rounded-sm transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
