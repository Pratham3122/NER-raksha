import React, { useState } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';

interface RiskFactor {
  name: string;
  score: number;
  description: string;
  weight: number;
}

interface RiskResult {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  factors: RiskFactor[];
  mlProbability?: number;
  isSynthetic?: boolean;
}

export default function RiskAnalysisPage() {
  const [segmentId, setSegmentId] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RiskResult | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Mock API delay
      await new Promise(r => setTimeout(r, 1000));
      
      if (!segmentId && (!lat || !lon)) throw new Error('Please provide either Segment ID or Coordinates');

      setResult({
        level: 'HIGH',
        score: 67.4,
        factors: [
          { name: 'Road Status', score: 80, description: 'Partially degraded surface detected', weight: 40 },
          { name: 'Weather', score: 60, description: 'Heavy rainfall expected in 2 hours', weight: 30 },
          { name: 'Incident Proximity', score: 45, description: 'Landslide 5km away', weight: 30 },
        ],
        mlProbability: 73,
        isSynthetic: true
      });
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-full flex gap-6 text-slate-100">
      {/* Left Panel */}
      <div className="w-1/3 bg-slate-800 border border-slate-700 rounded-sm p-4 flex flex-col space-y-6">
        <h2 className="text-xl font-bold">Risk Analysis Workspace</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">ROAD SEGMENT ID</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 text-sm p-2 rounded-sm focus:border-blue-500 focus:outline-none" 
              placeholder="e.g. RS-9921"
              value={segmentId}
              onChange={e => setSegmentId(e.target.value)}
            />
          </div>
          
          <div className="flex items-center text-slate-500 text-xs font-bold uppercase my-2">
            <div className="flex-1 border-t border-slate-700"></div>
            <span className="px-2">OR</span>
            <div className="flex-1 border-t border-slate-700"></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">LATITUDE</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 text-sm p-2 rounded-sm focus:border-blue-500 focus:outline-none" 
                placeholder="26.1445"
                value={lat}
                onChange={e => setLat(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">LONGITUDE</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 text-sm p-2 rounded-sm focus:border-blue-500 focus:outline-none" 
                placeholder="91.7362"
                value={lon}
                onChange={e => setLon(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm transition-colors disabled:opacity-50"
        >
          ANALYZE RISK
        </button>
      </div>

      {/* Right Panel */}
      <div className="w-2/3 bg-slate-800 border border-slate-700 rounded-sm p-6 flex flex-col">
        {loading && <div className="flex-1 flex items-center justify-center"><LoadingSpinner message="Analyzing segment risk..." /></div>}
        {error && <ErrorState message={error} />}
        {!loading && !error && !result && <div className="flex-1 flex items-center justify-center"><EmptyState title="Select a road segment to analyze risk" /></div>}
        
        {!loading && !error && result && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-start border-b border-slate-700 pb-6">
              <div>
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Overall Risk Score</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-bold">{result.score.toFixed(1)}</span>
                  <span className="text-xl text-slate-500">/ 100</span>
                </div>
              </div>
              
              <div className={`px-6 py-2 border-2 rounded-sm font-bold text-2xl uppercase tracking-widest ${
                result.level === 'CRITICAL' ? 'bg-red-950 text-red-400 border-red-800' :
                result.level === 'HIGH' ? 'bg-orange-950 text-orange-400 border-orange-800' :
                result.level === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                'bg-green-950 text-green-400 border-green-800'
              }`}>
                {result.level}
              </div>
            </div>

            {result.mlProbability !== undefined && (
              <div className="bg-slate-900 border border-slate-700 p-4 rounded-sm flex justify-between items-center">
                <div>
                  <div className="text-blue-400 font-bold tracking-wide">ML DISRUPTION PROBABILITY: {result.mlProbability}%</div>
                  {result.isSynthetic && <div className="text-xs text-slate-500 mt-1">[PROTOTYPE MODEL | SYNTHETIC DATA]</div>}
                </div>
                <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${result.mlProbability}%` }}></div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">Contributing Factors</h3>
              <div className="space-y-4">
                {result.factors.map(factor => (
                  <div key={factor.name} className="bg-slate-900 p-4 rounded-sm border border-slate-700">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="font-bold text-slate-200">{factor.name}</div>
                        <div className="text-sm text-slate-400 mt-1">{factor.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-mono">{factor.score}/100</div>
                        <div className="text-xs text-slate-500">Weight: {factor.weight}%</div>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${factor.score > 75 ? 'bg-red-500' : factor.score > 50 ? 'bg-orange-500' : factor.score > 25 ? 'bg-amber-500' : 'bg-green-500'}`} 
                        style={{ width: `${factor.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
