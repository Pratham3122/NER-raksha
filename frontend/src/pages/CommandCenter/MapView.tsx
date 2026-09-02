import React from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, LayersControl, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const MapView: React.FC = () => {
  // Demo incident markers
  const incidents = [
    { lat: 26.1445, lon: 91.7362, label: 'Guwahati Hub', color: 'blue', type: 'HQ' },
    { lat: 25.5788, lon: 91.8933, label: 'Landslide - NH-37', color: 'red', type: 'CRITICAL' },
    { lat: 26.7509, lon: 94.2037, label: 'Flood - Jorhat', color: 'orange', type: 'HIGH' },
    { lat: 24.8333, lon: 92.7789, label: 'Silchar Hospital', color: 'green', type: 'DESTINATION' },
    { lat: 27.4728, lon: 94.9120, label: 'AT RISK - Dibrugarh', color: 'orange', type: 'AT_RISK' },
    { lat: 25.3588, lon: 91.3668, label: 'Shillong Civil Hospital', color: 'green', type: 'DESTINATION' },
  ];

  const colorMap: Record<string, string> = {
    red: '#ef4444',
    orange: '#f97316',
    blue: '#3b82f6',
    green: '#22c55e',
  };

  // Demo route line (Guwahati → Silchar via waypoints)
  const route = [
    [26.1445, 91.7362],
    [25.9120, 91.8836],
    [25.5100, 92.2600],
    [24.8333, 92.7789],
  ] as [number, number][];

  // High-risk route (dashed red)
  const riskRoute = [
    [26.1445, 91.7362],
    [26.3000, 92.4000],
    [26.7509, 94.2037],
  ] as [number, number][];

  return (
    <div className="absolute inset-0">
      <MapContainer 
        center={[26.1445, 91.7362]} 
        zoom={8} 
        className="w-full h-full"
        zoomControl={true}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Dark Map (English)">
            <TileLayer
              className="dark-tiles"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Standard Map (English)">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Wikimedia'
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="Active Routes">
            <Polyline positions={route} pathOptions={{ color: '#22c55e', weight: 4, dashArray: '8,4', opacity: 0.8 }} />
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="High-Risk Routes">
            <Polyline positions={riskRoute} pathOptions={{ color: '#ef4444', weight: 4, opacity: 0.6 }} />
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Incidents & POIs">
            <React.Fragment>
              {incidents.map((inc, i) => (
                <CircleMarker 
                  key={i}
                  center={[inc.lat, inc.lon]}
                  radius={7}
                  pathOptions={{
                    color: '#fff',
                    weight: 2,
                    fillColor: colorMap[inc.color],
                    fillOpacity: 1
                  }}
                >
                  <Popup>
                    <div className="text-slate-900 font-bold">{inc.label}</div>
                    <div className="text-xs text-slate-500">{inc.type}</div>
                  </Popup>
                </CircleMarker>
              ))}
            </React.Fragment>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700 rounded p-2 text-xs text-slate-300 space-y-1 z-[1000] pointer-events-none">
        <div className="font-bold text-slate-200 mb-1">LEGEND</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"></span>Safe Route / Operational</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>Blocked / Critical Incident</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>At Risk</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>Command HQ</div>
        <div className="mt-1 text-[10px] text-slate-500">[CARTO TILES + DEMO MARKERS]</div>
      </div>
    </div>
  );
};

