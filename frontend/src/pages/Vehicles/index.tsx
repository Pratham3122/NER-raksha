import React, { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorState from '@/components/ui/ErrorState';
import Drawer from '@/components/ui/Drawer';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  cargo: string;
  priority: string;
  status: string;
  speed: number;
  heading: number;
  is_simulated: boolean;
  last_updated: string;
}

const DEMO_VEHICLES: Vehicle[] = [
  { id: 'V-1001', name: 'Convoy Alpha', type: 'TRUCK', cargo: 'Medical Supplies', priority: 'CRITICAL', status: 'MOVING', speed: 45, heading: 135, is_simulated: true, last_updated: new Date().toISOString() },
  { id: 'V-1002', name: 'Relief Transport 1', type: 'VAN', cargo: 'Food Rations', priority: 'IMPORTANT', status: 'AT_RISK', speed: 12, heading: 45, is_simulated: true, last_updated: new Date().toISOString() },
  { id: 'V-1003', name: 'Ambulance NE-04', type: 'AMBULANCE', cargo: 'Emergency Medical', priority: 'CRITICAL', status: 'REROUTING', speed: 30, heading: 90, is_simulated: true, last_updated: new Date().toISOString() },
  { id: 'V-1004', name: 'Rescue Team 7', type: 'RESCUE', cargo: 'Rescue Equipment', priority: 'IMPORTANT', status: 'MOVING', speed: 55, heading: 180, is_simulated: true, last_updated: new Date().toISOString() },
  { id: 'V-1005', name: 'Supply Truck B', type: 'TRUCK', cargo: 'Blankets & Tents', priority: 'NORMAL', status: 'STOPPED', speed: 0, heading: 0, is_simulated: true, last_updated: new Date().toISOString() },
  { id: 'V-1006', name: 'Aid Van South', type: 'VAN', cargo: 'Water Purifiers', priority: 'IMPORTANT', status: 'DELAYED', speed: 5, heading: 270, is_simulated: false, last_updated: new Date().toISOString() },
];

const STATUS_COLORS: Record<string, string> = {
  MOVING: 'bg-green-950 text-green-400 border-green-800',
  STOPPED: 'bg-slate-900 text-slate-400 border-slate-700',
  DELAYED: 'bg-orange-950 text-orange-400 border-orange-800',
  AT_RISK: 'bg-red-950 text-red-400 border-red-800',
  REROUTING: 'bg-blue-950 text-blue-400 border-blue-800',
  ARRIVED: 'bg-teal-950 text-teal-400 border-teal-800',
  OFFLINE: 'bg-slate-900 text-slate-600 border-slate-800',
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEMO_VEHICLES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [simNotice, setSimNotice] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/vehicles?limit=50', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.length > 0) {
          setVehicles(data.data);
          setError(null);
          return;
        }
      }
    } catch { /* fall through to demo */ }
    // Fallback to demo data — simulate some movement
    setVehicles(prev => prev.map(v => ({
      ...v,
      speed: v.status === 'MOVING' ? Math.round(30 + Math.random() * 30) : v.speed,
      last_updated: new Date().toISOString(),
    })));
    setError(null);
  };

  useEffect(() => {
    const load = async () => {
      await fetchVehicles();
      setLoading(false);
    };
    load();
    const interval = setInterval(fetchVehicles, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async (action: 'start' | 'pause' | 'reset') => {
    if (!selectedVehicle) return;
    try {
      await fetch(`http://localhost:8000/api/vehicles/${selectedVehicle.id}/simulate/${action}`, {
        method: 'POST',
        signal: AbortSignal.timeout(3000),
      });
      setSimNotice(`Simulation ${action.toUpperCase()}ED for ${selectedVehicle.id}`);
    } catch {
      setSimNotice(`[DEMO] Simulation ${action.toUpperCase()} (API offline — demo response)`);
    }
    setTimeout(() => setSimNotice(null), 3000);
    await fetchVehicles();
  };

  if (loading) return <LoadingSpinner message="Loading vehicle fleet..." />;
  if (error) return <ErrorState message={error} retry={fetchVehicles} />;

  const stats = {
    total: vehicles.length,
    moving: vehicles.filter(v => v.status === 'MOVING').length,
    atRisk: vehicles.filter(v => ['AT_RISK', 'DELAYED', 'REROUTING'].includes(v.status)).length,
    critical: vehicles.filter(v => v.priority === 'CRITICAL').length,
    arrived: vehicles.filter(v => v.status === 'ARRIVED').length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 text-slate-100 h-full flex flex-col overflow-auto">

      {/* Notice Toast */}
      {simNotice && (
        <div className="fixed bottom-6 right-6 bg-blue-900 border border-blue-700 text-blue-200 px-4 py-3 rounded text-sm font-medium shadow-xl z-50 transition-all">
          {simNotice}
        </div>
      )}

      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold">Vehicle Operations</h1>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
          Auto-refresh every 8s [DEMO SIMULATION]
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 shrink-0">
        {[
          { label: 'Total Fleet', value: stats.total, color: 'text-slate-200' },
          { label: 'Moving', value: stats.moving, color: 'text-green-400' },
          { label: 'At Risk / Delayed', value: stats.atRisk, color: 'text-amber-400' },
          { label: 'Critical Priority', value: stats.critical, color: 'text-red-400' },
          { label: 'Arrived', value: stats.arrived, color: 'text-teal-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-800 border border-slate-700 p-3 rounded-sm">
            <div className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">{stat.label}</div>
            <div className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-900 border-b border-slate-700 sticky top-0">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-300 text-xs uppercase">ID</th>
                <th className="px-4 py-3 font-semibold text-slate-300 text-xs uppercase">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-300 text-xs uppercase">Type</th>
                <th className="px-4 py-3 font-semibold text-slate-300 text-xs uppercase">Cargo / Priority</th>
                <th className="px-4 py-3 font-semibold text-slate-300 text-xs uppercase">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-300 text-xs uppercase">Speed</th>
                <th className="px-4 py-3 font-semibold text-slate-300 text-xs uppercase">Last Updated</th>
                <th className="px-4 py-3 font-semibold text-slate-300 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr
                  key={v.id}
                  className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                    v.priority === 'CRITICAL' ? 'border-l-2 border-l-red-600' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{v.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">{v.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{v.type}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-300 text-sm">{v.cargo}</div>
                    <div className={`text-[10px] font-bold mt-0.5 ${
                      v.priority === 'CRITICAL' ? 'text-red-400' :
                      v.priority === 'IMPORTANT' ? 'text-amber-400' : 'text-slate-500'
                    }`}>{v.priority}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${STATUS_COLORS[v.status] || 'bg-slate-900 text-slate-400 border-slate-700'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{v.speed} km/h</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(v.last_updated).toLocaleTimeString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelectedVehicle(v); setIsDrawerOpen(true); }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold border border-blue-900 hover:border-blue-700 px-2 py-1 rounded transition-colors"
                    >
                      DETAILS
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Vehicle Details" width="md">
        {selectedVehicle && (
          <div className="space-y-5 text-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{selectedVehicle.name}</h2>
                <span className="font-mono text-slate-400 text-sm">{selectedVehicle.id}</span>
              </div>
              <div className="flex gap-2">
                {selectedVehicle.is_simulated && (
                  <span className="px-2 py-1 text-xs bg-blue-950 text-blue-400 border border-blue-800 rounded font-bold">SIMULATED</span>
                )}
                <span className={`px-2 py-1 text-xs border rounded font-bold ${STATUS_COLORS[selectedVehicle.status] || ''}`}>
                  {selectedVehicle.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Type', value: selectedVehicle.type },
                { label: 'Speed', value: `${selectedVehicle.speed} km/h` },
                { label: 'Heading', value: `${selectedVehicle.heading}°` },
                { label: 'Priority', value: selectedVehicle.priority },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-900 p-3 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">{label}</div>
                  <div className="font-semibold text-slate-200">{value}</div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 p-3 rounded border border-slate-700">
              <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Cargo</div>
              <div className="font-semibold text-slate-200">{selectedVehicle.cargo}</div>
              <div className={`text-xs font-bold mt-1 ${
                selectedVehicle.priority === 'CRITICAL' ? 'text-red-400' :
                selectedVehicle.priority === 'IMPORTANT' ? 'text-amber-400' : 'text-slate-400'
              }`}>Priority: {selectedVehicle.priority}</div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-xs text-slate-400 uppercase font-bold mb-3">Simulation Controls</h3>
              <div className="flex gap-2">
                <button onClick={() => handleSimulate('start')} className="flex-1 py-2 bg-green-950 text-green-400 border border-green-800 rounded text-sm font-bold hover:bg-green-900 transition-colors">
                  ▶ START
                </button>
                <button onClick={() => handleSimulate('pause')} className="flex-1 py-2 bg-amber-950 text-amber-400 border border-amber-800 rounded text-sm font-bold hover:bg-amber-900 transition-colors">
                  ⏸ PAUSE
                </button>
                <button onClick={() => handleSimulate('reset')} className="flex-1 py-2 bg-red-950 text-red-400 border border-red-800 rounded text-sm font-bold hover:bg-red-900 transition-colors">
                  ↺ RESET
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
