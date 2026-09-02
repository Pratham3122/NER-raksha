import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { KPICard } from '../../components/ui/KPICard';
import { AlertBadge } from '../../components/ui/AlertBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MapView } from './MapView';

interface HealthData {
  overall: string;
  data_mode: string;
  version: string;
  components: Record<string, { status: string; message: string; latency_ms?: number }>;
}

const DEMO_ALERTS = [
  { id: 'ALT-001', severity: 'CRITICAL', title: 'NH-37 Blocked — Kaziranga', desc: 'Active landslide blocking both lanes near Kaziranga NP. Heavy vehicles cannot pass.', time: '2 min ago' },
  { id: 'ALT-002', severity: 'HIGH', title: 'Brahmaputra Bridge Risk Elevated', desc: 'Risk score increased to HIGH due to continuous rainfall. Structural monitoring active.', time: '15 min ago' },
  { id: 'ALT-003', severity: 'CRITICAL', title: 'Convoy Alpha Near Hazard Zone', desc: 'Vehicle V-1001 is 3.2km from active landslide. Auto-diversion suggested.', time: '18 min ago' },
];

const DEMO_TIMELINE = [
  { t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), e: 'Route Diversion Auto-Triggered', ent: 'TRK-9921', s: 'WARNING' },
  { t: '10:42', e: 'Bridge Status Changed to HIGH RISK', ent: 'Brahmaputra Bridge', s: 'CRITICAL' },
  { t: '10:38', e: 'Medical Delivery Arrived at Hospital', ent: 'Med Supply Drop 1', s: 'SUCCESS' },
  { t: '10:30', e: 'Weather Alert Updated — Red Zone', ent: 'Meghalaya East', s: 'WARNING' },
  { t: '10:15', e: 'ML Model Prediction: High Risk Segment', ent: 'NH-54 Barak Valley', s: 'HIGH' },
  { t: '10:00', e: 'Field Report Submitted & Verified', ent: 'FR-003 (Landslide)', s: 'INFO' },
];

export default function CommandCenter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/system/health');
      if (res.ok) setHealth(await res.json());
    } catch { /* API offline — normal in demo */ }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const acknowledgeAlert = (id: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, id]));
  };

  const dbOnline = health?.components?.database?.status === 'ONLINE';
  const mlOnline = health?.components?.ml?.status === 'ONLINE';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-slate-800 rounded animate-pulse" />
          ))}
        </div>
        <div className="flex gap-4 h-[calc(100vh-280px)]">
          <div className="flex-1 bg-slate-800 rounded animate-pulse" />
          <div className="w-80 bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">

      {/* System Status Banner */}
      {health && health.overall !== 'ONLINE' && (
        <div
          className="shrink-0 flex items-center justify-between bg-amber-950/60 border border-amber-800 rounded px-4 py-2 text-sm cursor-pointer hover:bg-amber-950"
          onClick={() => navigate('/system')}
        >
          <div className="flex items-center gap-2 text-amber-400">
            <span className="font-bold">⚠ SYSTEM PARTIAL OUTAGE</span>
            <span className="text-amber-500">— Database offline. Running in DEMO mode with synthetic data.</span>
          </div>
          <span className="text-amber-600 text-xs">VIEW SYSTEM HEALTH →</span>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 shrink-0">
        <KPICard label="Open Roads" value="1,432" status="success" />
        <KPICard label="At Risk" value="84" status="warning" />
        <KPICard label="Blocked" value="12" status="danger" />
        <KPICard label="Active Incidents" value="45" status="warning" />
        <KPICard label="Critical Alerts" value={`${DEMO_ALERTS.length - acknowledgedAlerts.size}`} status="danger" />
        <KPICard label="Vehicles Active" value={mlOnline ? "12 [ML]" : "12"} status="normal" />
        <KPICard label="Delayed Cargo" value="18" status="warning" />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">

        {/* Live Map */}
        <div className="flex-1 bg-[#1E293B] rounded border border-slate-800 overflow-hidden relative flex flex-col">
          <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              LIVE TACTICAL MAP — Northeast India
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-mono">{currentTime.toUTCString().split(' ').slice(0, 5).join(' ')} UTC</span>
              <button onClick={() => navigate('/routes')} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-bold transition-colors">
                PLAN ROUTE →
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            <MapView />
          </div>
        </div>

        {/* Right Panel - Alerts */}
        <div className="w-full lg:w-72 xl:w-80 bg-[#1E293B] rounded border border-slate-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center">
              <span className="flex h-2 w-2 relative mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              CRITICAL ALERTS
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-red-900/50 border border-red-800 px-2 py-0.5 rounded text-red-400 font-bold">
                {DEMO_ALERTS.length - acknowledgedAlerts.size} ACTIVE
              </span>
              <button onClick={() => navigate('/alerts')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">ALL →</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {DEMO_ALERTS.map(alert => {
              const acked = acknowledgedAlerts.has(alert.id);
              return (
                <div
                  key={alert.id}
                  className={`bg-slate-800/80 p-3 rounded border border-l-4 transition-all ${
                    acked
                      ? 'opacity-40 border-slate-700 border-l-slate-700'
                      : alert.severity === 'CRITICAL'
                      ? 'border-slate-700 border-l-red-500'
                      : 'border-slate-700 border-l-orange-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <AlertBadge severity={alert.severity as any} />
                    <span className="text-[10px] text-slate-500">{alert.time}</span>
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1 leading-tight">{alert.title}</h3>
                  <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">{alert.desc}</p>
                  {!acked && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="w-full py-1 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold rounded transition-colors"
                    >
                      ACKNOWLEDGE
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Timeline */}
      <div className="h-44 bg-[#1E293B] rounded border border-slate-800 flex flex-col shrink-0">
        <div className="p-2.5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">OPERATIONAL EVENT TIMELINE</h2>
          <span className="text-[10px] text-slate-600 font-mono">[DEMO DATA]</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs text-left text-slate-400">
            <thead className="text-[10px] text-slate-500 uppercase bg-slate-800/50 sticky top-0">
              <tr>
                <th className="px-3 py-1.5 font-medium">Time</th>
                <th className="px-3 py-1.5 font-medium">Event</th>
                <th className="px-3 py-1.5 font-medium hidden md:table-cell">Entity</th>
                <th className="px-3 py-1.5 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_TIMELINE.map((row, i) => (
                <tr key={i} className="border-b border-slate-800/70 hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-1.5 font-mono text-slate-500">{row.t}</td>
                  <td className="px-3 py-1.5 text-slate-300">{row.e}</td>
                  <td className="px-3 py-1.5 text-slate-500 hidden md:table-cell">{row.ent}</td>
                  <td className="px-3 py-1.5">
                    <StatusBadge status={row.s} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
