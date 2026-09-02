import React, { useState, useMemo } from 'react';
import EmptyState from '@/components/ui/EmptyState';

interface Delivery {
  id: string;
  vehicle: string;
  cargo: string;
  priority: 'CRITICAL' | 'IMPORTANT' | 'NORMAL';
  origin: string;
  destination: string;
  eta: string;
  delayMinutes: number;
  status: string;
}

export default function DeliveriesPage() {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'IMPORTANT' | 'NORMAL'>('ALL');
  
  const deliveries: Delivery[] = [
    { id: 'DEL-89312A', vehicle: 'Convoy Alpha', cargo: 'Medical Supplies', priority: 'CRITICAL', origin: 'Guwahati Base', destination: 'Silchar Hospital', eta: '14:30', delayMinutes: 45, status: 'IN_TRANSIT' },
    { id: 'DEL-44190B', vehicle: 'Truck 04', cargo: 'Water Purifiers', priority: 'IMPORTANT', origin: 'Tezpur', destination: 'Jorhat', eta: '16:00', delayMinutes: 0, status: 'ON_TIME' },
    { id: 'DEL-11209C', vehicle: 'Van 12', cargo: 'Blankets', priority: 'NORMAL', origin: 'Guwahati Base', destination: 'Nagaon', eta: '12:00', delayMinutes: 10, status: 'DELAYED' },
  ];

  const filteredDeliveries = useMemo(() => {
    if (filter === 'ALL') return deliveries;
    return deliveries.filter(d => d.priority === filter);
  }, [filter, deliveries]);

  const stats = {
    inTransit: deliveries.filter(d => d.status === 'IN_TRANSIT').length,
    delayed: deliveries.filter(d => d.delayMinutes > 0).length,
    criticalActive: deliveries.filter(d => d.priority === 'CRITICAL' && d.status !== 'DELIVERED').length,
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 h-full flex flex-col">
      <h1 className="text-2xl font-bold">Delivery Management</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-sm">
          <div className="text-slate-400 text-xs uppercase">In Transit</div>
          <div className="text-3xl font-bold text-blue-400">{stats.inTransit}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-sm">
          <div className="text-slate-400 text-xs uppercase">Delayed</div>
          <div className="text-3xl font-bold text-orange-400">{stats.delayed}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-sm">
          <div className="text-slate-400 text-xs uppercase">Critical Active</div>
          <div className="text-3xl font-bold text-red-400">{stats.criticalActive}</div>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-slate-700 pb-2">
        {['ALL', 'CRITICAL', 'IMPORTANT', 'NORMAL'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab as any)}
            className={`px-4 py-1 text-sm font-semibold rounded-sm transition-colors ${filter === tab ? 'bg-blue-600 text-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-sm overflow-hidden flex flex-col">
        {filteredDeliveries.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState title="No deliveries matching filters" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Cargo</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Origin</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">ETA</th>
                  <th className="px-4 py-3">Delay</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map(d => (
                  <tr key={d.id} className={`border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer ${d.priority === 'CRITICAL' ? 'border-l-4 border-l-red-500' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs">{d.id.substring(0, 8)}</td>
                    <td className="px-4 py-3">{d.vehicle}</td>
                    <td className="px-4 py-3 text-slate-300">{d.cargo}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded border ${d.priority === 'CRITICAL' ? 'bg-red-950 text-red-400 border-red-800' : d.priority === 'IMPORTANT' ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-slate-900 text-slate-300 border-slate-700'}`}>
                        {d.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{d.origin}</td>
                    <td className="px-4 py-3 text-slate-400">{d.destination}</td>
                    <td className="px-4 py-3 font-mono">{d.eta}</td>
                    <td className={`px-4 py-3 font-bold ${d.delayMinutes > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {d.delayMinutes > 0 ? `+${d.delayMinutes}m` : 'On Time'}
                    </td>
                    <td className="px-4 py-3">
                       <span className="text-xs px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
