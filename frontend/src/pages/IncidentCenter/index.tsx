import React, { useState } from 'react';
import { KPICard } from '../../components/ui/KPICard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AlertBadge } from '../../components/ui/AlertBadge';

interface Incident {
  id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  loc: string;
  time: string;
}

const DEMO_INCIDENTS: Incident[] = [
  { id: 'INC-092', title: 'Major Landslide on NH-6', type: 'LANDSLIDE', severity: 'CRITICAL', status: 'VERIFIED', loc: 'Sonapur, Meghalaya', time: '10:45 AM' },
  { id: 'INC-093', title: 'Road Accident — Lane Blocked', type: 'ACCIDENT', severity: 'HIGH', status: 'PENDING', loc: 'Nagaon Bypass', time: '11:20 AM' },
  { id: 'INC-094', title: 'Waterlogging — Passable', type: 'FLOOD', severity: 'MEDIUM', status: 'VERIFIED', loc: 'Guwahati City', time: '09:00 AM' },
  { id: 'INC-095', title: 'Bridge Routine Maintenance', type: 'BRIDGE_DAMAGE', severity: 'LOW', status: 'VERIFIED', loc: 'Saraighat Bridge', time: '08:00 AM' },
  { id: 'INC-096', title: 'Heavy Rainfall — Flash Flood Risk', type: 'FLOOD', severity: 'HIGH', status: 'PENDING', loc: 'Cherrapunjee Area', time: '10:15 AM' },
  { id: 'INC-097', title: 'Fallen Tree Blocking SH-7', type: 'ROAD_DAMAGE', severity: 'MEDIUM', status: 'PENDING', loc: 'SH-7 km 34', time: '09:45 AM' },
];

export default function IncidentCenter() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [incidents, setIncidents] = useState<Incident[]>(DEMO_INCIDENTS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'FLOOD', severity: 'MEDIUM', loc: '', description: ''
  });

  const filtered = incidents.filter(inc => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return inc.status === 'PENDING';
    if (activeTab === 'VERIFIED') return inc.status === 'VERIFIED';
    return true;
  });

  const handleSubmit = () => {
    if (!form.title || !form.loc) return;
    const newInc: Incident = {
      id: `INC-${100 + incidents.length}`,
      title: form.title,
      type: form.type,
      severity: form.severity,
      status: 'PENDING',
      loc: form.loc,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setIncidents(prev => [newInc, ...prev]);
    setForm({ title: '', type: 'FLOOD', severity: 'MEDIUM', loc: '', description: '' });
    setShowModal(false);
  };

  const stats = {
    critical: incidents.filter(i => i.severity === 'CRITICAL').length,
    high: incidents.filter(i => i.severity === 'HIGH').length,
    medium: incidents.filter(i => i.severity === 'MEDIUM').length,
    low: incidents.filter(i => i.severity === 'LOW').length,
  };

  return (
    <div className="h-full flex flex-col gap-4">

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-lg w-full max-w-lg shadow-2xl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white">REPORT NEW INCIDENT</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Incident Title *</label>
                <input
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-200 text-sm focus:border-blue-500 outline-none"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Brief description of incident..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Type</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-200 text-sm focus:border-blue-500 outline-none"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    {['FLOOD', 'LANDSLIDE', 'ROAD_DAMAGE', 'BRIDGE_DAMAGE', 'ACCIDENT', 'TRAFFIC', 'CLOSURE', 'OTHER'].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Severity</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-200 text-sm focus:border-blue-500 outline-none"
                    value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  >
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Location *</label>
                <input
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-200 text-sm focus:border-blue-500 outline-none"
                  value={form.loc}
                  onChange={e => setForm(f => ({ ...f, loc: e.target.value }))}
                  placeholder="Road name, district, landmark..."
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Description (optional)</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-200 text-sm focus:border-blue-500 outline-none resize-none"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Additional details..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-bold rounded transition-colors">
                CANCEL
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded transition-colors disabled:opacity-50"
                disabled={!form.title || !form.loc}
              >
                SUBMIT REPORT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <KPICard label="Critical Incidents" value={`${stats.critical}`} status="danger" />
        <KPICard label="High Severity" value={`${stats.high}`} status="warning" />
        <KPICard label="Medium Severity" value={`${stats.medium}`} status="warning" />
        <KPICard label="Low / Info" value={`${stats.low}`} status="normal" />
      </div>

      <div className="flex-1 bg-[#1E293B] rounded border border-slate-800 flex flex-col min-h-0">

        {/* Header & Tabs */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded border border-slate-700/50 inline-flex">
            {['ALL', 'PENDING', 'VERIFIED'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab} {tab !== 'ALL' && `(${incidents.filter(i => i.status === tab).length})`}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors"
          >
            + REPORT INCIDENT
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/80 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 font-semibold w-24">ID</th>
                <th className="px-5 py-3 font-semibold">Details</th>
                <th className="px-5 py-3 font-semibold w-32">Severity</th>
                <th className="px-5 py-3 font-semibold w-32">Status</th>
                <th className="px-5 py-3 font-semibold w-36 text-right">Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map(inc => (
                <tr key={inc.id} className="hover:bg-slate-800/50 cursor-pointer transition-colors group">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{inc.id}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{inc.title}</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{inc.type}</span>
                      <span>•</span>
                      <span>{inc.loc}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><AlertBadge severity={inc.severity as any} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={inc.status} size="sm" /></td>
                  <td className="px-5 py-3.5 text-right text-xs text-slate-400">{inc.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
