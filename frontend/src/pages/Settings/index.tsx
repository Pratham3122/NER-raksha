import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Map as MapIcon, Bell, Info, Save, RotateCcw, Check } from 'lucide-react';

export default function Settings() {
  // State
  const [dataMode, setDataMode] = useState('DEMO');
  const [routingEngine, setRoutingEngine] = useState('Demo Fallback');
  const [mlEnabled, setMlEnabled] = useState(true);
  
  const [mapCenter, setMapCenter] = useState('Northeast India');
  const [refreshInterval, setRefreshInterval] = useState('30s');
  const [showVehicles, setShowVehicles] = useState(true);
  const [showDemoLabels, setShowDemoLabels] = useState(true);
  
  const [criticalPopup, setCriticalPopup] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [minSeverity, setMinSeverity] = useState('HIGH+');

  const [showToast, setShowToast] = useState(false);
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = () => {
    setShowToast(true);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => setShowToast(false), 2000);
    setToastTimer(timer);
  };

  // Generic onChange handler to wrap value changes and trigger toast
  const handleChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    triggerToast();
  };

  const handleReset = () => {
    setDataMode('DEMO');
    setRoutingEngine('Demo Fallback');
    setMlEnabled(true);
    setMapCenter('Northeast India');
    setRefreshInterval('30s');
    setShowVehicles(true);
    setShowDemoLabels(true);
    setCriticalPopup(true);
    setSoundEnabled(false);
    setMinSeverity('HIGH+');
    triggerToast();
  };

  useEffect(() => {
    return () => {
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, [toastTimer]);

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-slate-200 relative pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-emerald-500" />
              Platform Settings
            </h1>
            <p className="text-slate-400 mt-2">Configure NER-RAKSHA system preferences and application behavior.</p>
          </div>
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            RESET TO DEFAULTS
          </button>
        </div>

        {/* 1. Data & API Settings */}
        <section className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Data & API Settings</h2>
          </div>
          <div className="p-6 space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">Data Mode</label>
              <div className="flex gap-4">
                {['DEMO', 'LIVE', 'MIXED'].map((mode) => (
                  <label key={mode} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${dataMode === mode ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-500 group-hover:border-slate-400'}`}>
                      {dataMode === mode && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                    </div>
                    <span className="text-slate-200">{mode}</span>
                    <input type="radio" className="hidden" checked={dataMode === mode} onChange={() => handleChange(setDataMode, mode)} />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">Routing Engine</label>
              <div className="flex flex-wrap gap-4">
                {['Demo Fallback', 'OSRM', 'OpenRouteService'].map((engine) => (
                  <label key={engine} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${routingEngine === engine ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-500 group-hover:border-slate-400'}`}>
                      {routingEngine === engine && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                    </div>
                    <span className="text-slate-200">{engine}</span>
                    <input type="radio" className="hidden" checked={routingEngine === engine} onChange={() => handleChange(setRoutingEngine, engine)} />
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between py-2 cursor-pointer group">
              <div>
                <div className="text-slate-200 font-medium group-hover:text-white transition-colors">Enable ML Disruption Prediction</div>
                <div className="text-sm text-slate-400">Run Random Forest model on simulated weather data</div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${mlEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${mlEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <input type="checkbox" className="hidden" checked={mlEnabled} onChange={(e) => handleChange(setMlEnabled, e.target.checked)} />
            </label>

          </div>
        </section>

        {/* 2. Display Preferences */}
        <section className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Display Preferences</h2>
          </div>
          <div className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Default Map Region</label>
                <select 
                  value={mapCenter}
                  onChange={(e) => handleChange(setMapCenter, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option>Northeast India</option>
                  <option>Assam</option>
                  <option>Meghalaya</option>
                  <option>Manipur</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Dashboard Auto-refresh</label>
                <select 
                  value={refreshInterval}
                  onChange={(e) => handleChange(setRefreshInterval, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option>10s</option>
                  <option>30s</option>
                  <option>60s</option>
                  <option>Off</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${showVehicles ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-900 border-slate-500 group-hover:border-slate-400'}`}>
                  {showVehicles && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-slate-200">Show simulated supply vehicles on map</span>
                <input type="checkbox" className="hidden" checked={showVehicles} onChange={(e) => handleChange(setShowVehicles, e.target.checked)} />
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${showDemoLabels ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-900 border-slate-500 group-hover:border-slate-400'}`}>
                  {showDemoLabels && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-slate-200">Show "DEMO DATA" overlay labels</span>
                <input type="checkbox" className="hidden" checked={showDemoLabels} onChange={(e) => handleChange(setShowDemoLabels, e.target.checked)} />
              </label>
            </div>

          </div>
        </section>

        {/* 3. Alert Settings */}
        <section className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Notification & Alerts</h2>
          </div>
          <div className="p-6 space-y-5">
            
            <label className="flex items-center justify-between py-2 cursor-pointer group">
              <div>
                <div className="text-slate-200 font-medium group-hover:text-white transition-colors">Critical Alert Popups</div>
                <div className="text-sm text-slate-400">Show modal interruptions for CRITICAL severity events</div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${criticalPopup ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${criticalPopup ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <input type="checkbox" className="hidden" checked={criticalPopup} onChange={(e) => handleChange(setCriticalPopup, e.target.checked)} />
            </label>

            <label className="flex items-center justify-between py-2 cursor-pointer group border-t border-slate-700/50 pt-4">
              <div>
                <div className="text-slate-200 font-medium group-hover:text-white transition-colors">Sound Notifications</div>
                <div className="text-sm text-slate-400">Play chime for incoming updates</div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <input type="checkbox" className="hidden" checked={soundEnabled} onChange={(e) => handleChange(setSoundEnabled, e.target.checked)} />
            </label>

            <div className="border-t border-slate-700/50 pt-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">Minimum severity for visual alerts</label>
              <select 
                value={minSeverity}
                onChange={(e) => handleChange(setMinSeverity, e.target.value)}
                className="w-full max-w-xs bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option>ALL</option>
                <option>MEDIUM+</option>
                <option>HIGH+</option>
                <option>CRITICAL only</option>
              </select>
            </div>

          </div>
        </section>

        {/* 4. About */}
        <section className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-6 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
          <div className="p-4 bg-slate-900/50 rounded-full text-emerald-500 border border-slate-700 shadow-inner">
            <Info className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">NER-RAKSHA System</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-400">
              <div><span className="font-semibold text-slate-300">Version:</span> v1.0.0 (Beta)</div>
              <div><span className="font-semibold text-slate-300">Event:</span> Smart India Hackathon 2024</div>
              <div><span className="font-semibold text-slate-300">Environment:</span> DEMO (Synthetic / OSM)</div>
              <div><span className="font-semibold text-slate-300">License:</span> MIT</div>
            </div>
          </div>
        </section>

      </div>

      {/* Toast Notification */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl shadow-emerald-900/20 font-medium transition-all duration-300 transform ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <Save className="w-4 h-4" />
        Settings saved successfully
      </div>

    </div>
  );
}
