import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
  AreaChart, Area, Legend
} from 'recharts';

const incidentData = [
  { day: 'Mon', incidents: 8, resolved: 5 },
  { day: 'Tue', incidents: 14, resolved: 9 },
  { day: 'Wed', incidents: 19, resolved: 13 },
  { day: 'Thu', incidents: 11, resolved: 8 },
  { day: 'Fri', incidents: 22, resolved: 16 },
  { day: 'Sat', incidents: 17, resolved: 12 },
  { day: 'Sun', incidents: 9, resolved: 7 }
];

const roadStatusData = [
  { name: 'OPEN', value: 1432, color: '#22c55e' },
  { name: 'AT_RISK', value: 84, color: '#fbbf24' },
  { name: 'DISRUPTED', value: 47, color: '#f97316' },
  { name: 'BLOCKED', value: 12, color: '#ef4444' }
];

const riskData = [
  { zone: 'Assam N', risk: 35 },
  { zone: 'Assam S', risk: 62 },
  { zone: 'Meghalaya', risk: 71 },
  { zone: 'Manipur', risk: 48 },
  { zone: 'Nagaland', risk: 29 },
  { zone: 'Tripura', risk: 44 },
  { zone: 'Arunachal', risk: 57 }
];

const deliveryData = [
  { day: 'Mon', onTime: 85, delayed: 15 },
  { day: 'Tue', onTime: 72, delayed: 28 },
  { day: 'Wed', onTime: 68, delayed: 32 },
  { day: 'Thu', onTime: 78, delayed: 22 },
  { day: 'Fri', onTime: 65, delayed: 35 },
  { day: 'Sat', onTime: 80, delayed: 20 },
  { day: 'Sun', onTime: 88, delayed: 12 }
];

export default function Analytics() {
  const [period, setPeriod] = useState('Last 7 days');

  const getRiskColor = (risk: number) => {
    if (risk < 40) return '#22c55e';
    if (risk < 60) return '#fbbf24';
    if (risk < 75) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics & Operational Reports</h1>
        <select 
          className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none text-white"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option>Last 24h</option>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Incidents', value: '142' },
          { label: 'Avg Risk Score', value: '47.3' },
          { label: 'Deliveries On-Time', value: '73%' },
          { label: 'Routes Computed', value: '38' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-slate-900 border border-slate-800 rounded p-4">
            <div className="text-slate-400 text-sm mb-1">{kpi.label}</div>
            <div className="text-2xl font-semibold text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded p-4 relative">
          <div className="absolute top-4 right-4 bg-blue-900/50 text-blue-400 text-xs px-2 py-0.5 rounded">DEMO DATA</div>
          <h2 className="text-lg font-medium mb-4">Incident Trend</h2>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={incidentData}>
                <XAxis dataKey="day" stroke="#64748b" tick={{fill: '#64748b'}} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc'}} />
                <Legend />
                <Area type="monotone" dataKey="incidents" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Incidents" />
                <Area type="monotone" dataKey="resolved" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded p-4 relative">
          <div className="absolute top-4 right-4 bg-blue-900/50 text-blue-400 text-xs px-2 py-0.5 rounded">DEMO DATA</div>
          <h2 className="text-lg font-medium mb-4">Road Network Status</h2>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={roadStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                  {roadStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc'}} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded p-4 relative">
          <div className="absolute top-4 right-4 bg-blue-900/50 text-blue-400 text-xs px-2 py-0.5 rounded">DEMO DATA</div>
          <h2 className="text-lg font-medium mb-4">Risk Score Distribution</h2>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={riskData}>
                <XAxis dataKey="zone" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc'}} cursor={{fill: '#1e293b'}} />
                <Bar dataKey="risk">
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded p-4 relative">
          <div className="absolute top-4 right-4 bg-blue-900/50 text-blue-400 text-xs px-2 py-0.5 rounded">DEMO DATA</div>
          <h2 className="text-lg font-medium mb-4">Delivery Performance</h2>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={deliveryData}>
                <XAxis dataKey="day" stroke="#64748b" tick={{fill: '#64748b'}} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc'}} />
                <Legend />
                <Line type="monotone" dataKey="onTime" stroke="#22c55e" strokeWidth={2} name="On-Time (%)" />
                <Line type="monotone" dataKey="delayed" stroke="#ef4444" strokeWidth={2} name="Delayed (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
