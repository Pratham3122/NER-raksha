import React from 'react';

interface AlertBadgeProps {
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({ severity }) => {
  let bgColor = 'bg-slate-700';
  let textColor = 'text-slate-300';
  let borderColor = 'border-slate-600';
  let showDot = false;

  switch (severity) {
    case 'INFO':
    case 'LOW':
      bgColor = 'bg-green-900';
      textColor = 'text-green-400';
      borderColor = 'border-green-800';
      break;
    case 'MEDIUM':
      bgColor = 'bg-amber-900';
      textColor = 'text-amber-400';
      borderColor = 'border-amber-800';
      break;
    case 'HIGH':
      bgColor = 'bg-orange-900';
      textColor = 'text-orange-400';
      borderColor = 'border-orange-800';
      break;
    case 'CRITICAL':
      bgColor = 'bg-red-900';
      textColor = 'text-red-400';
      borderColor = 'border-red-800';
      showDot = true;
      break;
  }

  return (
    <span className={`inline-flex items-center font-medium rounded border uppercase text-xs px-2 py-0.5 ${bgColor} ${textColor} ${borderColor}`}>
      {showDot && (
        <span className="mr-1.5 flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
      {severity}
    </span>
  );
};
