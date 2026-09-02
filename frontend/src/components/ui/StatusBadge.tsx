import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let bgColor = 'bg-slate-700';
  let textColor = 'text-slate-300';
  let borderColor = 'border-slate-600';
  let showDot = false;

  const normalizedStatus = status.toUpperCase();

  switch (normalizedStatus) {
    case 'OPEN':
    case 'ARRIVED':
    case 'VERIFIED':
    case 'LOW':
    case 'ONLINE':
      bgColor = 'bg-green-900';
      textColor = 'text-green-400';
      borderColor = 'border-green-800';
      break;
    case 'AT_RISK':
    case 'DELAYED':
    case 'MEDIUM':
    case 'DEGRADED':
      bgColor = 'bg-amber-900';
      textColor = 'text-amber-400';
      borderColor = 'border-amber-800';
      break;
    case 'SEVERELY_DISRUPTED':
    case 'HIGH':
      bgColor = 'bg-orange-900';
      textColor = 'text-orange-400';
      borderColor = 'border-orange-800';
      break;
    case 'BLOCKED':
    case 'REJECTED':
    case 'OFFLINE':
      bgColor = 'bg-red-900';
      textColor = 'text-red-400';
      borderColor = 'border-red-800';
      break;
    case 'CRITICAL':
      bgColor = 'bg-red-900';
      textColor = 'text-red-400';
      borderColor = 'border-red-800';
      showDot = true;
      break;
    case 'MOVING':
      bgColor = 'bg-blue-900';
      textColor = 'text-blue-400';
      borderColor = 'border-blue-800';
      break;
    case 'REROUTING':
      bgColor = 'bg-purple-900';
      textColor = 'text-purple-400';
      borderColor = 'border-purple-800';
      break;
    case 'PENDING':
      bgColor = 'bg-slate-700';
      textColor = 'text-slate-300';
      borderColor = 'border-slate-600';
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded border uppercase ${bgColor} ${textColor} ${borderColor} ${sizeClasses[size]}`}>
      {showDot && (
        <span className="mr-1.5 flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
      {normalizedStatus.replace(/_/g, ' ')}
    </span>
  );
};
