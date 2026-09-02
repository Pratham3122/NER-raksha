import React, { useState } from 'react';
import { Plus, X, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Report {
  id: string;
  type: string;
  severity: string;
  status: string;
  lat: number;
  lon: number;
  reporter: string;
  time: string;
}

const initialReports: Report[] = [
  { id: 'FR-001', type: 'LANDSLIDE', severity: 'CRITICAL', status: 'VERIFIED', lat: 25.5788, lon: 91.8933, reporter: 'Rahul D.', time: '10:34 AM' },
  { id: 'FR-002', type: 'FLOOD', severity: 'HIGH', status: 'PENDING', lat: 26.1445, lon: 91.7362, reporter: 'Priya S.', time: '09:12 AM' },
  { id: 'FR-003', type: 'ROAD_DAMAGE', severity: 'MEDIUM', status: 'PENDING', lat: 27.1045, lon: 93.6053, reporter: 'Anuj K.', time: '08:55 AM' },
];

export default function FieldReports() {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'FLOOD',
    severity: 'MEDIUM',
    description: '',
    lat: '',
    lon: '',
    reporter: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: Report = {
      id: `FR-${String(reports.length + 1).padStart(3, '0')}`,
      type: formData.type,
      severity: formData.severity,
      status: 'PENDING',
      lat: parseFloat(formData.lat) || 0,
      lon: parseFloat(formData.lon) || 0,
      reporter: formData.reporter || 'Unknown',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setReports([newReport, ...reports]);
    setIsModalOpen(false);
    setFormData({ type: 'FLOOD', severity: 'MEDIUM', description: '', lat: '', lon: '', reporter: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-amber-500 text-white';
      case 'LOW': return 'bg-emerald-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Field Report Center</h1>
            <p className="text-slate-400 mt-1">Submit and monitor incidents reported by field agents</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-5 h-5" />
            SUBMIT NEW REPORT
          </button>
        </div>

        {/* Reports Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium border-b border-slate-700">ID</th>
                  <th className="p-4 font-medium border-b border-slate-700">Type</th>
                  <th className="p-4 font-medium border-b border-slate-700">Severity</th>
                  <th className="p-4 font-medium border-b border-slate-700">Location</th>
                  <th className="p-4 font-medium border-b border-slate-700">Reporter</th>
                  <th className="p-4 font-medium border-b border-slate-700">Time</th>
                  <th className="p-4 font-medium border-b border-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-medium text-white">{report.id}</td>
                    <td className="p-4 text-slate-300 font-medium">{report.type.replace('_', ' ')}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-sm">{report.lat.toFixed(4)}, {report.lon.toFixed(4)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{report.reporter}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-4 h-4" />
                        {report.time}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center border px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No reports available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Submit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-slate-900/50">
              <h2 className="text-xl font-semibold text-white">Submit Field Report</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400">Incident Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="FLOOD">Flood</option>
                    <option value="LANDSLIDE">Landslide</option>
                    <option value="ROAD_DAMAGE">Road Damage</option>
                    <option value="BRIDGE_DAMAGE">Bridge Damage</option>
                    <option value="ACCIDENT">Accident</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400">Severity</label>
                  <select 
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-400">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-h-[100px] resize-none"
                  placeholder="Describe the incident..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400">Latitude</label>
                  <input 
                    type="number" step="any"
                    value={formData.lat}
                    onChange={(e) => setFormData({...formData, lat: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="e.g. 25.5788"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400">Longitude</label>
                  <input 
                    type="number" step="any"
                    value={formData.lon}
                    onChange={(e) => setFormData({...formData, lon: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="e.g. 91.8933"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-400">Reporter Name</label>
                <input 
                  type="text"
                  value={formData.reporter}
                  onChange={(e) => setFormData({...formData, reporter: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-lg shadow-emerald-900/20"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
