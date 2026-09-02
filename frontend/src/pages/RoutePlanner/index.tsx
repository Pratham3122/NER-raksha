import React, { useState, useEffect, useRef } from 'react';
import { Truck, Cross, Box, Shield, User, AlertTriangle, Zap, Scale, Navigation, ChevronDown, Check, Settings, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const LOCATIONS = [
  { id: 'guwahati', name: 'Guwahati Logistics Hub', lat: 26.1445, lon: 91.7362 },
  { id: 'shillong', name: 'Shillong Civil Hospital', lat: 25.5788, lon: 91.8933 },
  { id: 'silchar', name: 'Silchar Distribution Center', lat: 24.8333, lon: 92.7789 },
  { id: 'tezpur', name: 'Tezpur Air Base', lat: 26.6338, lon: 92.8000 },
  { id: 'jorhat', name: 'Jorhat Medical College', lat: 26.7509, lon: 94.2037 },
  { id: 'dibrugarh', name: 'Dibrugarh Relief Camp', lat: 27.4728, lon: 94.9120 },
  { id: 'imphal', name: 'Imphal Center', lat: 24.8170, lon: 93.9368 },
];

const LocationSelect = ({ label, value, onChange, placeholder }: any) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = LOCATIONS.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
  const selected = LOCATIONS.find(l => l.id === value);
  return (
    <div className="relative">
      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{label}</label>
      <div 
        className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-slate-200 cursor-pointer flex justify-between items-center"
        onClick={() => setOpen(!open)}
      >
        <span>{selected ? selected.name : placeholder}</span>
        <ChevronDown size={16} />
      </div>
      {open && (
        <div className="absolute z-[100] mt-1 w-full bg-slate-800 border border-slate-600 rounded shadow-xl max-h-60 flex flex-col">
          <div className="p-2 bg-slate-800 border-b border-slate-700 shrink-0">
            <input autoFocus type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="overflow-y-auto">
            {filtered.map(loc => (
              <div key={loc.id} className="p-3 hover:bg-blue-600/30 cursor-pointer text-sm text-slate-200" onClick={() => { onChange(loc.id); setOpen(false); setSearch(''); }}>{loc.name}</div>
            ))}
            {filtered.length === 0 && <div className="p-3 text-sm text-slate-500">No locations found.</div>}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-[99]" onClick={() => setOpen(false)} />}
    </div>
  );
};

const BoundsUpdater = ({ bounds }: any) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [bounds, map]);
  return null;
};

const RouteMap: React.FC<{ optimization: string, fromId: string, toId: string, onStats: (stats: any) => void }> = ({ optimization, fromId, toId, onStats }) => {
  const fromLoc = LOCATIONS.find(l => l.id === fromId) || LOCATIONS[0];
  const toLoc = LOCATIONS.find(l => l.id === toId) || LOCATIONS[1];

  const [fastRoute, setFastRoute] = useState<[number, number][]>([]);
  const [safeRoute, setSafeRoute] = useState<[number, number][]>([]);
  
  useEffect(() => {
    fetch(`https://router.project-osrm.org/route/v1/driving/${fromLoc.lon},${fromLoc.lat};${toLoc.lon},${toLoc.lat}?overview=full&geometries=geojson&alternatives=true`)
      .then(r => r.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          const r1 = data.routes[0];
          setFastRoute(r1.geometry.coordinates.map((c: any) => [c[1], c[0]]));
          const fastDist = Math.round(r1.distance / 1000);
          const fastTime = Math.round(r1.duration / 60);
          
          let safeDist = fastDist + 24;
          let safeTime = fastTime + 35;
          
          if (data.routes.length > 1) {
            const r2 = data.routes[1];
            setSafeRoute(r2.geometry.coordinates.map((c: any) => [c[1], c[0]]));
            safeDist = Math.round(r2.distance / 1000);
            safeTime = Math.round(r2.duration / 60);
          } else {
            const midLat = (fromLoc.lat + toLoc.lat) / 2 + (Math.random() * 0.3 - 0.15);
            const midLon = (fromLoc.lon + toLoc.lon) / 2 + (Math.random() * 0.3 - 0.15);
            setSafeRoute([ [fromLoc.lat, fromLoc.lon], [midLat, midLon], [toLoc.lat, toLoc.lon] ]);
          }
          onStats({ fastDist, fastTime, safeDist, safeTime });
        }
      })
      .catch(e => console.error(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLoc, toLoc]);

  const bounds = [ [fromLoc.lat, fromLoc.lon], [toLoc.lat, toLoc.lon] ] as [number, number][];

  return (
    <div className="w-full h-full">
      <MapContainer center={[(fromLoc.lat + toLoc.lat)/2, (fromLoc.lon + toLoc.lon)/2]} zoom={7} className="w-full h-full" zoomControl={false}>
        <BoundsUpdater bounds={bounds} />
        <TileLayer
          className="dark-tiles"
          url="https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Wikimedia'
        />
        
        {optimization !== 'FASTEST' && safeRoute.length > 0 && (
          <Polyline positions={safeRoute} pathOptions={{ color: '#22c55e', weight: 4, dashArray: '10,5' }}>
            <Popup>SAFE ROUTE</Popup>
          </Polyline>
        )}
        
        {fastRoute.length > 0 && (
          <Polyline positions={fastRoute} pathOptions={{ color: '#ef4444', weight: 3, opacity: 0.6 }}>
            <Popup>FAST ROUTE (HIGH RISK)</Popup>
          </Polyline>
        )}

        <CircleMarker center={[fromLoc.lat, fromLoc.lon]} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: '#3b82f6', fillOpacity: 1 }}>
          <Popup><b>{fromLoc.name}</b><br/>Origin</Popup>
        </CircleMarker>
        
        <CircleMarker center={[toLoc.lat, toLoc.lon]} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: '#22c55e', fillOpacity: 1 }}>
          <Popup><b>{toLoc.name}</b><br/>Destination</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
};

export default function RoutePlanner() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [missionType, setMissionType] = useState<string>('');
  const [from, setFrom] = useState('guwahati');
  const [to, setTo] = useState('shillong');
  const [routeStats, setRouteStats] = useState({ fastDist: 118, fastTime: 205, safeDist: 142, safeTime: 252 });

  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };
  const [priority, setPriority] = useState<string>('NORMAL');
  const [optimization, setOptimization] = useState<string>('BALANCED');
  const [avoidBlocked, setAvoidBlocked] = useState(true);
  const [avoidDisrupted, setAvoidDisrupted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const handleFindRoutes = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1800);
  };

  const handleSelectRoute = (routeId: string) => {
    setSelectedRoute(routeId);
    alert(`✅ Route ${routeId === 'safe' ? 'SAFEST BALANCED' : 'FASTEST (HIGH RISK)'} selected.\n\nIn a live system, this would dispatch navigation instructions to the vehicle and create a tracking entry.`);
  };

  return (
    <div className="h-full flex flex-col bg-[#0F172A] text-slate-200">

      {/* Progress Header */}
      <div className="flex items-center justify-center py-5 px-4 border-b border-slate-800 bg-[#1E293B] shrink-0">
        {[
          { n: 1, label: 'Mission Setup' },
          { n: 2, label: 'Optimization' },
          { n: 3, label: 'Route Results' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && <div className={`w-16 h-0.5 mx-2 ${step > i ? 'bg-blue-600' : 'bg-slate-700'}`} />}
            <button
              onClick={() => step > s.n && setStep(s.n as any)}
              className={`flex items-center gap-2 ${step >= s.n ? 'text-blue-400' : 'text-slate-600'} ${step > s.n ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all ${
                step > s.n ? 'border-blue-500 bg-blue-600 text-white' :
                step === s.n ? 'border-blue-500 bg-blue-900/30 text-blue-400' :
                'border-slate-700 bg-slate-800 text-slate-600'
              }`}>
                {step > s.n ? <Check size={14} /> : s.n}
              </div>
              <span className="text-sm font-semibold hidden sm:block">{s.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#1E293B] p-6 rounded-lg border border-slate-700 shadow-xl">
              <h2 className="text-xl font-bold mb-6 tracking-wide text-white flex items-center gap-2">
                <Navigation size={20} className="text-blue-400" /> PLAN A MISSION
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <LocationSelect label="From" value={from} onChange={setFrom} placeholder="Select origin..." />
                <LocationSelect label="To" value={to} onChange={setTo} placeholder="Select destination..." />
              </div>

              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Mission Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {[
                  { id: 'general', icon: Truck, label: 'General Transport' },
                  { id: 'medical', icon: Cross, label: 'Medical Supply' },
                  { id: 'food', icon: Box, label: 'Food / Essentials' },
                  { id: 'rescue', icon: Shield, label: 'Search & Rescue' },
                  { id: 'personnel', icon: User, label: 'Personnel' },
                  { id: 'critical', icon: AlertTriangle, label: 'Critical Supplies' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMissionType(m.id); if (m.id === 'critical' || m.id === 'rescue' || m.id === 'medical') setPriority('CRITICAL'); }}
                    className={`p-4 flex flex-col items-center justify-center rounded border transition-all ${
                      missionType === m.id
                        ? 'bg-blue-900/30 border-blue-500 text-blue-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <m.icon size={24} className="mb-2" />
                    <span className="text-sm font-semibold text-center">{m.label}</span>
                  </button>
                ))}
              </div>

              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Cargo Priority</h3>
              <div className="flex bg-slate-800 rounded border border-slate-700 p-1 mb-6">
                {['NORMAL', 'IMPORTANT', 'CRITICAL'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded text-sm font-bold transition-all ${
                      priority === p
                        ? p === 'CRITICAL'
                          ? 'bg-red-900/50 text-red-400 border border-red-800'
                          : p === 'IMPORTANT'
                          ? 'bg-amber-900/40 text-amber-400'
                          : 'bg-slate-700 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {priority === 'CRITICAL' && (
                <div className="bg-amber-900/20 border border-amber-800 rounded p-3 mb-6 flex items-center text-amber-400 text-sm">
                  <AlertTriangle size={16} className="mr-2 shrink-0" />
                  SAFEST route optimization will be automatically prioritized for critical missions.
                </div>
              )}

              <div className="flex justify-end mt-6 border-t border-slate-700 pt-6">
                <button
                  onClick={() => { if (priority === 'CRITICAL') setOptimization('SAFEST'); setStep(2); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded flex items-center transition-colors"
                >
                  CONTINUE <ChevronDown className="-rotate-90 ml-2" size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#1E293B] p-6 rounded-lg border border-slate-700 shadow-xl">
              <h2 className="text-xl font-bold mb-2 tracking-wide text-white">HOW SHOULD WE PRIORITIZE?</h2>
              <p className="text-sm text-slate-400 mb-6">
                Route: <span className="text-slate-200 font-medium">{LOCATIONS.find(l=>l.id===from)?.name}</span> → <span className="text-slate-200 font-medium">{LOCATIONS.find(l=>l.id===to)?.name}</span>
              </p>

              <div className="space-y-3 mb-8">
                {[
                  { id: 'FASTEST', icon: Zap, label: 'FASTEST', desc: 'Minimize travel time. Higher risk of disruption on high-risk road segments.', color: 'text-amber-400', border: 'border-amber-500', bg: 'bg-amber-900/20' },
                  { id: 'BALANCED', icon: Scale, label: 'BALANCED', desc: 'Optimal balance between travel time and road risk score (50/50 weighting).', color: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-900/20' },
                  { id: 'SAFEST', icon: Shield, label: 'SAFEST', desc: 'Maximize safety. Avoids all AT_RISK and DISRUPTED segments. May take significantly longer.', color: 'text-green-400', border: 'border-green-500', bg: 'bg-green-900/20' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setOptimization(opt.id)}
                    className={`w-full p-4 flex items-center rounded border-2 transition-all text-left ${
                      optimization === opt.id ? `${opt.bg} ${opt.border}` : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className={`p-3 rounded-full bg-slate-900 mr-4 ${optimization === opt.id ? opt.color : 'text-slate-500'}`}>
                      <opt.icon size={22} />
                    </div>
                    <div className="flex-1">
                      <div className={`text-base font-bold ${optimization === opt.id ? 'text-white' : 'text-slate-300'}`}>{opt.label}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{opt.desc}</div>
                    </div>
                    {optimization === opt.id && <div className={`${opt.color} ml-2`}><Check size={22} /></div>}
                  </button>
                ))}
              </div>

              <div className="bg-slate-800/50 rounded p-4 border border-slate-700 mb-8">
                <h3 className="text-sm font-bold text-slate-300 uppercase mb-4 flex items-center">
                  <Settings size={14} className="mr-2" /> Advanced Constraints
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={avoidBlocked}
                      onChange={e => setAvoidBlocked(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 accent-blue-500"
                    />
                    <span className="text-slate-300 text-sm">Strictly avoid <span className="text-red-400 font-bold">BLOCKED</span> road segments</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={avoidDisrupted}
                      onChange={e => setAvoidDisrupted(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 accent-blue-500"
                    />
                    <span className="text-slate-300 text-sm">Avoid <span className="text-orange-400 font-bold">SEVERELY DISRUPTED</span> segments</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between border-t border-slate-700 pt-6">
                <button onClick={() => setStep(1)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded transition-colors">
                  ← BACK
                </button>
                <button
                  onClick={handleFindRoutes}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded flex items-center transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <><RefreshCw className="animate-spin mr-2" size={18} /> CALCULATING...</>
                  ) : (
                    <><Navigation className="mr-2" size={18} /> FIND SAFE ROUTES</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="h-full flex flex-col lg:flex-row gap-4" style={{ minHeight: 'calc(100vh - 220px)' }}>

            {/* Map */}
            <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hidden lg:block min-h-[400px]">
              <div className="h-10 flex items-center px-3 bg-slate-900 border-b border-slate-700 text-xs font-bold text-slate-300 tracking-wider">
                GEOSPATIAL ROUTE VIEW — {LOCATIONS.find(l=>l.id===from)?.name} → {LOCATIONS.find(l=>l.id===to)?.name}
              </div>
              <div className="relative" style={{ height: 'calc(100% - 40px)' }}>
                <RouteMap optimization={optimization} fromId={from} toId={to} onStats={setRouteStats} />
                <div className="absolute bottom-3 left-3 bg-slate-900/90 text-[10px] text-slate-400 border border-slate-700 rounded px-2 py-1 z-[1000]">
                  [OSM TILES + DEMO ROUTE DATA]
                </div>
              </div>
            </div>

            {/* Routes Panel */}
            <div className="w-full lg:w-[420px] flex flex-col gap-4 shrink-0">

              {/* Route 1 - Recommended */}
              <div className={`bg-[#1E293B] border-2 rounded-lg overflow-hidden shadow-lg relative transition-all ${
                selectedRoute === 'safe' ? 'border-green-400' : 'border-green-600'
              }`}>
                <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  RECOMMENDED
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-white mb-4 pr-28">
                    {optimization === 'FASTEST' ? 'FASTEST' : optimization === 'SAFEST' ? 'SAFEST' : 'SAFEST BALANCED'} OPTION
                  </h3>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Est. Time</div>
                      <div className="text-lg font-bold text-white">{formatTime(routeStats.safeTime)}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Distance</div>
                      <div className="text-lg font-bold text-white">{routeStats.safeDist} km</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Risk</div>
                      <div className="mt-1"><StatusBadge status="LOW" size="sm" /></div>
                    </div>
                  </div>

                  <div className="text-xs text-amber-400 flex items-center mb-4">
                    <AlertTriangle size={12} className="mr-1" /> Expected delay: +15 min (checkpoint)
                  </div>

                  <div className="bg-green-900/10 border border-green-900/50 rounded p-3 text-sm text-slate-300 mb-5">
                    <span className="font-bold text-green-400 block mb-1">Why this route?</span>
                    Avoids the active landslide on NH-40 via Cherrapunjee by taking the NH-6 bypass through Jowai. Adds ~45 min but guarantees safe passage.
                  </div>

                  <button
                    onClick={() => handleSelectRoute('safe')}
                    className={`w-full font-bold py-3 rounded transition-colors ${
                      selectedRoute === 'safe'
                        ? 'bg-green-700 text-white cursor-default'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {selectedRoute === 'safe' ? '✓ ROUTE SELECTED' : 'SELECT ROUTE & DISPATCH'}
                  </button>
                </div>
              </div>

              {/* Route 2 */}
              <div className={`bg-[#1E293B] rounded-lg overflow-hidden border transition-all ${
                selectedRoute === 'fast' ? 'border-red-500' : 'border-slate-700 opacity-75 hover:opacity-100'
              }`}>
                <div className="p-5">
                  <h3 className="text-base font-bold text-slate-300 mb-4">FASTEST (HIGH RISK)</h3>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Est. Time</div>
                      <div className="text-lg font-bold text-white">{formatTime(routeStats.fastTime)}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Distance</div>
                      <div className="text-lg font-bold text-white">{routeStats.fastDist} km</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Risk</div>
                      <div className="mt-1"><StatusBadge status="HIGH" size="sm" /></div>
                    </div>
                  </div>

                  <div className="text-xs text-red-400 flex items-center mb-4">
                    <AlertTriangle size={12} className="mr-1" /> Active landslide zone on NH-40. High delay probability.
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectRoute('fast')}
                      className={`flex-1 font-bold py-2 rounded transition-colors text-sm ${
                        selectedRoute === 'fast'
                          ? 'bg-red-700 text-white cursor-default'
                          : 'bg-slate-700 hover:bg-red-900/50 hover:border-red-800 border border-slate-600 text-slate-200'
                      }`}
                    >
                      {selectedRoute === 'fast' ? '✓ SELECTED' : 'USE THIS ROUTE'}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setStep(2); setSelectedRoute(null); }}
                className="text-slate-400 hover:text-blue-400 text-sm font-bold uppercase self-center transition-colors"
              >
                ← Modify Parameters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
