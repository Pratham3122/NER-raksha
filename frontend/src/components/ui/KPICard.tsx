import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: number | string;
  subtext?: string;
  status?: 'normal' | 'warning' | 'danger' | 'success';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subtext,
  status = 'normal',
  icon,
  trend
}) => {
  let borderClass = 'border-slate-700';
  let textClass = 'text-slate-100';

  switch (status) {
    case 'warning':
      borderClass = 'border-amber-500';
      break;
    case 'danger':
      borderClass = 'border-red-500';
      break;
    case 'success':
      borderClass = 'border-green-500';
      break;
    case 'normal':
    default:
      borderClass = 'border-blue-500';
      break;
  }

  return (
    <div className={`bg-slate-800 rounded border border-slate-700 border-l-4 ${borderClass} p-4 flex flex-col justify-between h-full`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      
      <div className="flex items-end space-x-2">
        <span className={`text-2xl font-bold tracking-tight ${textClass}`}>{value}</span>
        
        {trend && (
          <span className={`flex items-center text-xs mb-1 ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
            {trend === 'up' && <ArrowUpRight size={14} />}
            {trend === 'down' && <ArrowDownRight size={14} />}
            {trend === 'stable' && <Minus size={14} />}
          </span>
        )}
      </div>

      {subtext && <div className="text-slate-500 text-xs mt-1 truncate">{subtext}</div>}
    </div>
  );
};
