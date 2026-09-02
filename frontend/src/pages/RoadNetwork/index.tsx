import React, { useState } from 'react';

const INITIAL_ROADS = [
  { id:'RS-001', road:'NH-37 Kaziranga Segment', class:'NH', district:'Golaghat', status:'BLOCKED', risk:95, condition:'VERY_POOR', updated:'10:45 AM' },
  { id:'RS-002', road:'NH-27 Assam Valley', class:'NH', district:'Bongaigaon', status:'OPEN', risk:12, condition:'GOOD', updated:'10:30 AM' },
  { id:'RS-003', road:'NH-6 Barak Valley', class:'NH', district:'Cachar', status:'AT_RISK', risk:68, condition:'POOR', updated:'10:20 AM' },
  { id:'RS-004', road:'SH-5 Shillong Bypass', class:'SH', district:'East Khasi Hills', status:'AT_RISK', risk:54, condition:'FAIR', updated:'09:55 AM' },
  { id:'RS-005', road:'NH-2 Guwahati-Meghalaya', class:'NH', district:'Kamrup', status:'OPEN', risk:22, condition:'GOOD', updated:'09:40 AM' },
  { id:'RS-006', road:'NH-54 Silchar Highway', class:'NH', district:'Hailakandi', status:'SEVERELY_DISRUPTED', risk:81, condition:'VERY_POOR', updated:'09:30 AM' },
  { id:'RS-007', road:'Imphal Ring Road', class:'SH', district:'Imphal West', status:'OPEN', risk:15, condition:'FAIR', updated:'09:00 AM' },
  { id:'RS-008', road:'NH-29 Dimapur-Kohima', class:'NH', district:'Dimapur', status:'AT_RISK', risk:47, condition:'POOR', updated:'08:45 AM' },
  { id:'RS-009', road:'NH-40 Shillong-Dawki', class:'NH', district:'East Khasi Hills', status:'OPEN', risk:31, condition:'FAIR', updated:'08:30 AM' },
  { id:'RS-010', road:'District Road DR-156', class:'DR', district:'Morigaon', status:'BLOCKED', risk:100, condition:'VERY_POOR', updated:'08:00 AM' }
];

export default function RoadNetwork() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const filteredRoads = INITIAL_ROADS.filter(r => {
    const matchesSearch = r.road.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'OPEN': return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium border border-green-500/30">OPEN</span>;
      case 'AT_RISK': return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-medium border border-amber-500/30">AT RISK</span>;
      case 'SEVERELY_DISRUPTED': return <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-medium border border-orange-500/30">DISRUPTED</span>;
      case 'BLOCKED': return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium border border-red-500/30">BLOCKED</span>;
      default: return <span>{status}</span>;
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk < 40) return 'bg-green-500';
    if (risk < 60) return 'bg-amber-500';
    if (risk < 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200">
      <h1 className="text-2xl font-bold text-white mb-6">Road Network Monitor</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded p-4">
          <div className="text-slate-400 text-sm mb-1">Total Segments</div>
          <div className="text-2xl font-semibold text-white">1,575</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-4">
          <div className="text-slate-400 text-sm mb-1">Open</div>
          <div className="text-2xl font-semibold text-green-400">1,432</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-4">
          <div className="text-slate-400 text-sm mb-1">At Risk (Inc. Disrupted)</div>
          <div className="text-2xl font-semibold text-amber-400">131</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-4">
          <div className="text-slate-400 text-sm mb-1">Blocked</div>
          <div className="text-2xl font-semibold text-red-400">12</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded mb-6 flex flex-col md:flex-row justify-between items-center p-4 gap-4">
        <input 
          type="text" 
          placeholder="Search by ID or Name..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-slate-200 px-4 py-2 rounded outline-none w-full md:w-64 focus:border-blue-500"
        />
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'OPEN', 'AT_RISK', 'SEVERELY_DISRUPTED', 'BLOCKED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-sm transition-colors font-medium border ${
                filter === f 
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-sm bg-slate-900/50">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Road Name</th>
              <th className="p-4 font-medium">Class</th>
              <th className="p-4 font-medium">District</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Risk Score</th>
              <th className="p-4 font-medium">Condition</th>
              <th className="p-4 font-medium">Last Updated</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoads.map((row) => (
              <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-sm font-mono text-slate-300">{row.id}</td>
                <td className="p-4 text-sm text-white font-medium">{row.road}</td>
                <td className="p-4 text-sm text-slate-300">{row.class}</td>
                <td className="p-4 text-sm text-slate-300">{row.district}</td>
                <td className="p-4">{getStatusBadge(row.status)}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-6 text-slate-400">{row.risk}</span>
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getRiskColor(row.risk)}`}
                        style={{ width: `${row.risk}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-300">{row.condition.replace('_', ' ')}</td>
                <td className="p-4 text-sm text-slate-500">{row.updated}</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => alert(`View details for ${row.id}`)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded transition-colors font-medium border border-slate-700"
                  >
                    VIEW DETAILS
                  </button>
                </td>
              </tr>
            ))}
            {filteredRoads.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  No road segments match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
