import React from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface OperationalMapProps {
  incidents?: any[];
  vehicles?: any[];
  showRoads?: boolean;
}

export default function OperationalMap({ incidents = [], vehicles = [], showRoads = true }: OperationalMapProps) {
  // Demo road segments for visualization
  const demoRoads = [
    { id: 'R1', coords: [[26.1445, 91.7362], [26.1800, 91.8000]], status: 'OPEN', color: '#4ade80' },
    { id: 'R2', coords: [[26.1800, 91.8000], [26.2500, 92.0000]], status: 'AT_RISK', color: '#fbbf24' },
    { id: 'R3', coords: [[26.1445, 91.7362], [25.9000, 91.8000]], status: 'BLOCKED', color: '#f87171' }
  ];

  return (
    <div className="h-full w-full relative z-0 bg-slate-900">
      <MapContainer center={[26.1445, 91.7362]} zoom={9} className="h-full w-full" zoomControl={true}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Dark Map">
            <TileLayer
              className="dark-tiles"
              url="https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Wikimedia'
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked={showRoads} name="Road Network">
            <React.Fragment>
              {demoRoads.map(road => (
                <Polyline 
                  key={road.id} 
                  positions={road.coords as [number, number][]} 
                  pathOptions={{ color: road.color, weight: 4 }}
                >
                  <Popup>
                    <div className="text-slate-900 font-bold">{road.id}</div>
                    <div className="text-sm">{road.status}</div>
                  </Popup>
                </Polyline>
              ))}
            </React.Fragment>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Incidents">
            <React.Fragment>
              {incidents.map((inc, i) => (
                <CircleMarker 
                  key={`inc-${i}`} 
                  center={[inc.lat || 26.14, inc.lon || 91.73]} 
                  radius={8}
                  pathOptions={{ 
                    color: inc.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                    fillColor: inc.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                    fillOpacity: 0.7 
                  }}
                >
                  <Popup>{inc.type} - {inc.severity}</Popup>
                </CircleMarker>
              ))}
            </React.Fragment>
          </LayersControl.Overlay>
        </LayersControl>
        
        {/* Watermark */}
        <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none opacity-50 font-bold text-slate-500 tracking-widest text-sm">
          [NER-RAKSHA DEMO DATA]
        </div>
      </MapContainer>
    </div>
  );
}
