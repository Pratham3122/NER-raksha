import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const originIcon = new L.DivIcon({
  html: `<div style="background-color:#22c55e; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const destIcon = new L.DivIcon({
  html: `<div style="background-color:#ef4444; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface RouteOption {
  id: string;
  coordinates: [number, number][]; // [lat, lng] array
  summary: string;
}

interface RouteMapProps {
  options: RouteOption[];
  selectedRouteId: string | null;
  onRouteSelect: (id: string) => void;
  origin?: [number, number];
  destination?: [number, number];
}

function MapBoundsFitter({ options, origin, destination }: { options: RouteOption[], origin?: [number, number], destination?: [number, number] }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (options.length === 0 && !origin && !destination) return;
    
    const bounds = L.latLngBounds([]);
    if (origin) bounds.extend(origin);
    if (destination) bounds.extend(destination);
    
    options.forEach(opt => {
      opt.coordinates.forEach(coord => bounds.extend(coord));
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, options, origin, destination]);

  return null;
}

export default function RouteMap({ options, selectedRouteId, onRouteSelect, origin, destination }: RouteMapProps) {
  const getRouteStyle = (index: number, isSelected: boolean) => {
    if (isSelected) return { color: '#2563EB', weight: 5, dashArray: '' }; // Recommended/Selected
    if (index === 1) return { color: '#94A3B8', weight: 3, dashArray: '10, 10' }; // Alt 1
    return { color: '#64748B', weight: 3, dashArray: '5, 5' }; // Alt 2
  };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer center={[26.1445, 91.7362]} zoom={8} className="h-full w-full" zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <MapBoundsFitter options={options} origin={origin} destination={destination} />

        {options.map((opt, index) => {
          const isSelected = selectedRouteId === opt.id;
          const style = getRouteStyle(index, isSelected);
          
          return (
            <Polyline
              key={opt.id}
              positions={opt.coordinates}
              pathOptions={{ color: style.color, weight: style.weight, dashArray: style.dashArray }}
              eventHandlers={{ click: () => onRouteSelect(opt.id) }}
              className="cursor-pointer"
            >
              <Popup>{opt.summary}</Popup>
            </Polyline>
          );
        })}

        {origin && <Marker position={origin} icon={originIcon}><Popup>Origin</Popup></Marker>}
        {destination && <Marker position={destination} icon={destIcon}><Popup>Destination</Popup></Marker>}
      </MapContainer>
    </div>
  );
}
