import React from 'react';
import { Database, Clock, RefreshCw, CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react';

interface DataSource {
  name: string;
  status: 'INTEGRATED' | 'DEMO_FALLBACK' | 'NOT_INTEGRATED';
  updated: string;
  desc: string;
  type: string;
}

const dataSources: DataSource[] = [
  { name: 'OpenStreetMap / Overpass', status: 'INTEGRATED', updated: 'Live', desc: 'Road network topology for Northeast India', type: 'Roads / GIS' },
  { name: 'Open-Meteo API', status: 'INTEGRATED', updated: 'Every 30min', desc: 'Hourly rainfall and temperature forecasts', type: 'Weather' },
  { name: 'GADM Boundaries', status: 'INTEGRATED', updated: 'Static', desc: 'State and district polygon boundaries', type: 'Administrative' },
  { name: 'OSRM Routing', status: 'DEMO_FALLBACK', updated: 'On-request', desc: 'Turn-by-turn route planning engine', type: 'Routing' },
  { name: 'NASA SRTM DEM', status: 'INTEGRATED', updated: 'Static', desc: '30m resolution elevation and slope data', type: 'Terrain' },
  { name: 'GDACS Disasters', status: 'DEMO_FALLBACK', updated: 'Every 1h', desc: 'Global disaster alert and coordination system', type: 'Disaster' },
  { name: 'NDMA India', status: 'NOT_INTEGRATED', updated: 'Manual', desc: 'National Disaster Management Authority reports', type: 'Policy' },
  { name: 'ML Risk Model', status: 'INTEGRATED', updated: 'On-demand', desc: 'Random Forest disruption prediction model', type: 'ML / Analytics' },
  { name: 'IMD Weather', status: 'NOT_INTEGRATED', updated: '-', desc: 'India Meteorological Department official data', type: 'Weather' },
];

export default function DataSources() {
  const activeCount = dataSources.filter(d => d.status === 'INTEGRATED' || d.status === 'DEMO_FALLBACK').length;

  const getStatusDisplay = (status: DataSource['status']) => {
    switch (status) {
      case 'INTEGRATED':
        return {
          icon: <CheckCircle2 className="w-4 h-4 mr-1.5" />,
          text: 'INTEGRATED',
          styles: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
        };
      case 'DEMO_FALLBACK':
        return {
          icon: <AlertCircle className="w-4 h-4 mr-1.5" />,
          text: 'DEMO / FALLBACK',
          styles: 'border-amber-500/50 text-amber-400 bg-amber-500/10'
        };
      case 'NOT_INTEGRATED':
        return {
          icon: <XCircle className="w-4 h-4 mr-1.5" />,
          text: 'NOT INTEGRATED',
          styles: 'border-slate-600 text-slate-400 bg-slate-800'
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-700/60 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Database className="w-8 h-8 text-emerald-500" />
              Data Source Registry
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl">
              Monitor the status and health of external APIs, datasets, and models powering the NER-RAKSHA platform.
            </p>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="font-medium text-white">{activeCount} of {dataSources.length}</span>
            <span className="text-slate-400 text-sm">sources active</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dataSources.map((source, idx) => {
            const statusDisplay = getStatusDisplay(source.status);
            
            return (
              <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-500 transition-colors flex flex-col h-full shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-white leading-tight pr-2">
                    {source.name}
                  </h3>
                  <div className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${statusDisplay.styles}`}>
                    {statusDisplay.icon}
                    {statusDisplay.text}
                  </div>
                </div>
                
                <p className="text-slate-400 text-sm mb-5 flex-grow">
                  {source.desc}
                </p>
                
                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-700/50 mt-auto">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded text-slate-300 font-medium">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    {source.type}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <RefreshCw className="w-3.5 h-3.5" />
                    {source.updated}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
