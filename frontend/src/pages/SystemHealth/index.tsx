import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Server, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ComponentHealth {
  status: string;
  message: string;
  latency_ms?: number;
}

interface SystemHealthData {
  overall: string;
  data_mode: string;
  version: string;
  components: {
    [key: string]: ComponentHealth;
  };
}

export default function SystemHealth() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/system/health');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError('Cannot connect to API at localhost:8000');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const getOverallStatusStyles = (status: string) => {
    switch (status) {
      case 'ALL SYSTEMS ONLINE': 
      case 'ONLINE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'PARTIAL OUTAGE': 
      case 'DEGRADED': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'SYSTEM OFFLINE': 
      case 'OFFLINE': return 'bg-red-500/20 text-red-400 border-red-500/40';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  const renderComponentDot = (status: string) => {
    if (status === 'ONLINE') return <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />;
    if (status === 'OFFLINE') return <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />;
    return <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />;
  };

  const getDisplayOverallStatus = (overall?: string) => {
    if (!overall) return 'UNKNOWN';
    if (overall === 'ONLINE') return 'ALL SYSTEMS ONLINE';
    if (overall === 'OFFLINE') return 'SYSTEM OFFLINE';
    return 'PARTIAL OUTAGE';
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-slate-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-700/60 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-emerald-500" />
              System Diagnostics
            </h1>
            <p className="text-slate-400 mt-2">Live monitoring of NER-RAKSHA backend services and data pipelines.</p>
          </div>
          
          <button 
            onClick={fetchHealth}
            disabled={isLoading}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg border border-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            REFRESH NOW
          </button>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-red-500" />
            <div className="text-red-400 font-medium text-lg">{error}</div>
            <p className="text-slate-400 text-sm">Please ensure the FastAPI backend is running on port 8000.</p>
          </div>
        ) : !healthData && isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <div>Fetching system health metrics...</div>
          </div>
        ) : healthData ? (
          <>
            {/* Top Banner */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border shadow-lg ${getOverallStatusStyles(healthData.overall)}`}>
              <div className="flex items-center gap-4">
                {healthData.overall === 'ONLINE' ? (
                  <CheckCircle className="w-8 h-8" />
                ) : healthData.overall === 'OFFLINE' ? (
                  <XCircle className="w-8 h-8" />
                ) : (
                  <AlertTriangle className="w-8 h-8" />
                )}
                <div>
                  <div className="text-sm font-semibold opacity-80 uppercase tracking-wider">Overall Status</div>
                  <div className="text-2xl font-bold">{getDisplayOverallStatus(healthData.overall)}</div>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex gap-4 opacity-90">
                <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg">
                  <Server className="w-4 h-4" />
                  <span className="font-mono text-sm font-medium">{healthData.data_mode} MODE</span>
                </div>
                <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg">
                  <Activity className="w-4 h-4" />
                  <span className="font-mono text-sm font-medium">v{healthData.version}</span>
                </div>
              </div>
            </div>

            {/* Component Grid */}
            <h2 className="text-xl font-bold text-white pt-4">Service Components</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Object.entries(healthData.components).map(([key, component]) => (
                <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:bg-slate-750 transition-colors shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-white capitalize">
                      {key.replace(/_/g, ' ')}
                    </h3>
                    {renderComponentDot(component.status)}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Status Message</div>
                      <div className="text-sm text-slate-300 font-medium bg-slate-900/50 p-2 rounded-md font-mono">
                        {component.message || 'No message provided'}
                      </div>
                    </div>
                    
                    {component.latency_ms !== undefined && (
                      <div className="flex justify-between items-center border-t border-slate-700/50 pt-3">
                        <span className="text-xs text-slate-400">Response Latency</span>
                        <span className={`text-sm font-mono font-medium ${component.latency_ms > 1000 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {component.latency_ms} ms
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

      </div>
    </div>
  );
}
