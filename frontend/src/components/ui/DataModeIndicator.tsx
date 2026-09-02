import React from 'react';
import { Database } from 'lucide-react';

interface DataModeIndicatorProps {
  mode: 'LIVE' | 'DEMO' | 'MIXED' | 'OFFLINE';
}

export const DataModeIndicator: React.FC<DataModeIndicatorProps> = ({ mode }) => {
  let bgColor = 'bg-slate-700';
  let textColor = 'text-slate-300';
  
  switch (mode) {
    case 'LIVE':
      bgColor = 'bg-green-900';
      textColor = 'text-green-400';
      break;
    case 'DEMO':
      bgColor = 'bg-amber-900';
      textColor = 'text-amber-400';
      break;
    case 'MIXED':
      bgColor = 'bg-blue-900';
      textColor = 'text-blue-400';
      break;
    case 'OFFLINE':
      bgColor = 'bg-red-900';
      textColor = 'text-red-400';
      break;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-slate-400 text-xs uppercase tracking-wider">Data Mode</span>
      <div className={`flex items-center px-2.5 py-1 rounded border border-current text-xs font-semibold ${bgColor} ${textColor}`}>
        <Database size={12} className="mr-1.5" />
        {mode}
      </div>
    </div>
  );
};
