import React, { useState } from 'react';

const INITIAL_ALERTS = [
  { id:'ALT-001', severity:'CRITICAL', type:'ROAD_BLOCKED', title:'NH-37 Blocked - Kaziranga', desc:'Active landslide blocking both lanes near Kaziranga National Park entrance. Heavy vehicles cannot pass.', location:'NH-37, km 245', time:'10:45 AM', status:'ACTIVE' },
  { id:'ALT-002', severity:'HIGH', type:'RISK_INCREASED', title:'Brahmaputra Bridge Risk Elevated', desc:'Risk score increased from MEDIUM to HIGH due to continuous rainfall. Structural monitoring in progress.', location:'Brahmaputra Bridge, Guwahati', time:'10:32 AM', status:'ACTIVE' },
  { id:'ALT-003', severity:'CRITICAL', type:'VEHICLE_APPROACHING_RISK', title:'Convoy Alpha Approaching Hazard Zone', desc:'Vehicle V-1001 is 3.2km from active landslide. Auto-diversion suggested via NH-27.', location:'V-1001 / NH-6', time:'10:28 AM', status:'ACTIVE' },
  { id:'ALT-004', severity:'HIGH', type:'SEVERE_WEATHER', title:'Extreme Rainfall Warning - Meghalaya', desc:'IMD issues red alert for Cherrapunjee region. Expected rainfall: 180mm in 6 hours.', location:'Meghalaya East District', time:'10:15 AM', status:'ACTIVE' },
  { id:'ALT-005', severity:'MEDIUM', type:'DELIVERY_DELAY', title:'Medical Supply Delivery Delayed +45min', desc:'DEL-89312A delayed due to traffic congestion at Silchar entry checkpoint.', location:'Silchar NH-54', time:'09:55 AM', status:'ACTIVE' },
  { id:'ALT-006', severity:'MEDIUM', type:'ROAD_BLOCKED', title:'State Highway 5 Partial Blockage', desc:'One lane blocked due to road repair works. Expect 20-30 min delay.', location:'SH-5, Shillong', time:'09:40 AM', status:'ACTIVE' },
  { id:'ALT-007', severity:'INFO', type:'SYSTEM', title:'ML Model Updated', desc:'Disruption prediction model retrained with latest 30-day data. Accuracy: 76.2%', location:'System', time:'09:00 AM', status:'ACTIVE' },
  { id:'ALT-008', severity:'HIGH', type:'ROUTE_INTERRUPTED', title:'Route MED-101 Interrupted', desc:'Active route for medical delivery interrupted by new landslide report. Recalculating...', location:'NH-6, Barak Valley', time:'08:45 AM', status:'ACKNOWLEDGED' },
  { id:'ALT-009', severity:'CRITICAL', type:'NEW_INCIDENT', title:'New Bridge Damage Reported', desc:'Field report confirmed: partial collapse of minor bridge on district road near Morigaon.', location:'Morigaon District', time:'08:30 AM', status:'ACTIVE' },
  { id:'ALT-010', severity:'MEDIUM', type:'RISK_INCREASED', title:'Flood Risk Rising - Dhubri District', desc:'River Brahmaputra water level at 92% of warning threshold near Dhubri.', location:'Dhubri District', time:'08:00 AM', status:'ACTIVE' },
  { id:'ALT-011', severity:'INFO', type:'SYSTEM', title:'Routine Drone Survey Completed', desc:'Sector 4 survey completed. No anomalies detected.', location:'Sector 4', time:'07:45 AM', status:'ACTIVE' },
  { id:'ALT-012', severity:'MEDIUM', type:'DELIVERY_DELAY', title:'Convoy Beta Stopped', desc:'Temporary halt requested by local authorities for VIP movement.', location:'NH-27', time:'07:15 AM', status:'ACTIVE' },
  { id:'ALT-013', severity:'INFO', type:'SYSTEM', title:'Sensor Calibration', desc:'River gauge sensors calibrated successfully.', location:'Guwahati', time:'06:30 AM', status:'ACTIVE' },
  { id:'ALT-014', severity:'MEDIUM', type:'VEHICLE_MAINTENANCE', title:'Vehicle V-1045 Maintenance Due', desc:'Routine 10,000 km checkup required in next 3 days.', location:'Depot', time:'06:00 AM', status:'ACTIVE' },
  { id:'ALT-015', severity:'INFO', type:'SYSTEM', title:'Shift Handover', desc:'Night shift handover completed to Day shift.', location:'Command Center', time:'05:30 AM', status:'ACTIVE' },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [filter, setFilter] = useState('ALL');

  const handleAcknowledge = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
  };

  const handleAcknowledgeAll = () => {
    setAlerts(alerts.map(a => {
      if (filter === 'ALL' || a.severity === filter) {
        return { ...a, status: 'ACKNOWLEDGED' };
      }
      return a;
    }));
  };

  const filteredAlerts = alerts.filter(a => filter === 'ALL' || a.severity === filter);
  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;

  const getBorderColor = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return 'border-red-500';
      case 'HIGH': return 'border-orange-500';
      case 'MEDIUM': return 'border-amber-500';
      case 'INFO': return 'border-blue-500';
      default: return 'border-slate-500';
    }
  };

  const getIcon = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '⚠️';
      case 'INFO': return 'ℹ️';
      default: return '🔔';
    }
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          Alert Feed
          <span className="bg-slate-800 text-slate-300 text-sm px-3 py-1 rounded-full border border-slate-700">
            {activeCount} Active
          </span>
        </h1>
        <button 
          onClick={handleAcknowledgeAll}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm transition-colors border border-slate-700"
        >
          Acknowledge All
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-800 pb-2">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFO'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-slate-800 text-white border-b-2 border-blue-500' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filteredAlerts.map(alert => {
          const isAck = alert.status === 'ACKNOWLEDGED';
          return (
            <div 
              key={alert.id}
              className={`bg-slate-900 border-l-4 rounded p-4 flex gap-4 transition-all ${
                isAck ? 'opacity-60 border-l-slate-700 border border-slate-800' : `border-y border-r border-slate-800 ${getBorderColor(alert.severity)}`
              }`}
            >
              <div className="text-2xl mt-1">{getIcon(alert.severity)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                      alert.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                      alert.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {alert.severity}
                    </span>
                    <h3 className="font-semibold text-white">{alert.title}</h3>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">{alert.time}</div>
                </div>
                <p className="text-slate-300 text-sm mb-2">{alert.desc}</p>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>📍 {alert.location}</span>
                  <span>•</span>
                  <span>{alert.id}</span>
                </div>
              </div>
              <div className="flex flex-col justify-center border-l border-slate-800 pl-4 ml-2">
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  disabled={isAck}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                    isAck 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isAck ? 'ACKNOWLEDGED' : 'ACKNOWLEDGE'}
                </button>
              </div>
            </div>
          );
        })}
        {filteredAlerts.length === 0 && (
          <div className="text-center p-8 text-slate-500 border border-dashed border-slate-800 rounded">
            No alerts found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
