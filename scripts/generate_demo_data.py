#!/usr/bin/env python3
"""
NER-RAKSHA Demo Data Generator
Generates synthetic but geographically realistic data for Northeast India.
All data labeled as DEMO.

Region: Northeast India (Assam, Meghalaya, Manipur, Mizoram)
Center: Guwahati, Assam (26.1445N, 91.7362E)

DATASET NOTE: This is synthetic data generated for demonstration purposes.
It follows real-world schemas and uses real geographic coordinates but
does NOT represent actual road conditions or incidents.
"""

import json
import random
import math
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

random.seed(42)  # Reproducible

# Real Northeast India locations
STATES = [
    {'name': 'Assam', 'code': 'AS', 'lat': 26.2006, 'lon': 92.9376},
    {'name': 'Meghalaya', 'code': 'ML', 'lat': 25.4670, 'lon': 91.3662},
    {'name': 'Manipur', 'code': 'MN', 'lat': 24.6637, 'lon': 93.9063},
    {'name': 'Mizoram', 'code': 'MZ', 'lat': 23.1645, 'lon': 92.9376},
    {'name': 'Nagaland', 'code': 'NL', 'lat': 26.1584, 'lon': 94.5624},
    {'name': 'Tripura', 'code': 'TR', 'lat': 23.9408, 'lon': 91.9882},
    {'name': 'Arunachal Pradesh', 'code': 'AR', 'lat': 28.2180, 'lon': 94.7278},
    {'name': 'Sikkim', 'code': 'SK', 'lat': 27.5330, 'lon': 88.5122},
]

DISTRICTS = [
    # Assam
    {'name': 'Kamrup', 'state': 'Assam', 'lat': 26.1445, 'lon': 91.7362, 'population': 2926543},
    {'name': 'Dibrugarh', 'state': 'Assam', 'lat': 27.4728, 'lon': 94.9109, 'population': 1327748},
    {'name': 'Jorhat', 'state': 'Assam', 'lat': 26.7509, 'lon': 94.2037, 'population': 1092256},
    {'name': 'Sonitpur', 'state': 'Assam', 'lat': 26.6338, 'lon': 92.7926, 'population': 1924110},
    # Meghalaya
    {'name': 'East Khasi Hills', 'state': 'Meghalaya', 'lat': 25.5788, 'lon': 91.8933, 'population': 825922},
    {'name': 'Ri Bhoi', 'state': 'Meghalaya', 'lat': 25.8833, 'lon': 91.9333, 'population': 258380},
    # Manipur
    {'name': 'Imphal West', 'state': 'Manipur', 'lat': 24.8170, 'lon': 93.9368, 'population': 517992},
    {'name': 'Senapati', 'state': 'Manipur', 'lat': 25.2666, 'lon': 94.0166, 'population': 478302},
]

# Real road corridors in Northeast India
ROAD_CORRIDORS = [
    {
        'name': 'NH-27 Guwahati-Dibrugarh',
        'class': 'national_highway',
        'waypoints': [
            [91.7362, 26.1445], [92.0000, 26.2000], [92.7926, 26.6338],
            [93.5000, 26.7000], [94.2037, 26.7509], [94.9109, 27.4728]
        ],
        'surface': 'asphalt', 'maxspeed': 80,
    },
    {
        'name': 'NH-6 Guwahati-Shillong',
        'class': 'national_highway',
        'waypoints': [
            [91.7362, 26.1445], [91.8000, 26.0000], [91.8500, 25.8000],
            [91.8933, 25.5788]
        ],
        'surface': 'asphalt', 'maxspeed': 60,
    },
    {
        'name': 'NH-37 Jorabat-Shillong via Byrnihat',
        'class': 'national_highway',
        'waypoints': [
            [91.8200, 26.0500], [91.8600, 25.9000], [91.9000, 25.7500],
            [91.8933, 25.5788]
        ],
        'surface': 'asphalt', 'maxspeed': 60,
    },
    {
        'name': 'NH-40 Shillong-Jowai',
        'class': 'national_highway',
        'waypoints': [
            [91.8933, 25.5788], [92.0000, 25.4500], [92.1500, 25.4500]
        ],
        'surface': 'asphalt', 'maxspeed': 50,
    },
    {
        'name': 'NH-2 Shillong-Imphal',
        'class': 'national_highway',
        'waypoints': [
            [91.8933, 25.5788], [92.5000, 25.0000], [93.0000, 24.8000],
            [93.9368, 24.8170]
        ],
        'surface': 'asphalt', 'maxspeed': 60,
    },
    {
        'name': 'SH-5 Guwahati Ring Road',
        'class': 'state_highway',
        'waypoints': [
            [91.7362, 26.1445], [91.8000, 26.1800], [91.8500, 26.1400],
            [91.8200, 26.1000], [91.7600, 26.1200], [91.7362, 26.1445]
        ],
        'surface': 'asphalt', 'maxspeed': 50,
    },
    {
        'name': 'MDR Shillong-Mawsynram',
        'class': 'major_district_road',
        'waypoints': [
            [91.8933, 25.5788], [91.7500, 25.4500], [91.5826, 25.2981]
        ],
        'surface': 'gravel', 'maxspeed': 30,
    },
    {
        'name': 'NH-229 Kohima Road',
        'class': 'national_highway',
        'waypoints': [
            [93.9368, 24.8170], [94.1000, 25.0000], [94.1500, 25.7000],
            [94.1056, 25.6751]
        ],
        'surface': 'asphalt', 'maxspeed': 50,
    },
]

INCIDENT_SCENARIOS = [
    # NH-6 area - flood/landslide prone
    {'type': 'LANDSLIDE', 'severity': 'CRITICAL', 'lat': 25.8000, 'lon': 91.8300,
     'title': 'Landslide on NH-6 km 45', 'desc': 'Major landslide blocking NH-6. Road completely blocked.'},
    {'type': 'FLOOD', 'severity': 'HIGH', 'lat': 26.0000, 'lon': 91.8100,
     'title': 'Flood waters on NH-6 approach', 'desc': 'Water level rising on road. Reduced to single lane.'},
    {'type': 'ROAD_DAMAGE', 'severity': 'MEDIUM', 'lat': 25.9500, 'lon': 91.8200,
     'title': 'Road surface erosion near Jorabat', 'desc': 'Heavy rainfall caused surface erosion. Passable with caution.'},
    # NH-27 area
    {'type': 'ACCIDENT', 'severity': 'HIGH', 'lat': 26.6000, 'lon': 92.5000,
     'title': 'Truck accident on NH-27', 'desc': 'Truck overturned. One lane blocked. Emergency services on site.'},
    {'type': 'FLOOD', 'severity': 'CRITICAL', 'lat': 26.7000, 'lon': 94.0000,
     'title': 'Bridge underpass flooded on NH-27', 'desc': 'Flash flood. Bridge approach submerged. No through traffic.'},
    # Meghalaya
    {'type': 'LANDSLIDE', 'severity': 'HIGH', 'lat': 25.4000, 'lon': 91.7000,
     'title': 'Debris fall near Mawsynram road', 'desc': 'Rock debris on MDR. Clearance in progress.'},
    {'type': 'ROAD_DAMAGE', 'severity': 'LOW', 'lat': 25.5500, 'lon': 91.9200,
     'title': 'Pothole damage near Shillong', 'desc': 'Multiple potholes. Slow traffic, vehicles advised caution.'},
    # Manipur
    {'type': 'CLOSURE', 'severity': 'HIGH', 'lat': 24.9000, 'lon': 93.8000,
     'title': 'Road closure for repairs near Imphal', 'desc': 'Scheduled maintenance. Alternate route recommended.'},
    # Additional
    {'type': 'BRIDGE_DAMAGE', 'severity': 'CRITICAL', 'lat': 26.3000, 'lon': 92.1000,
     'title': 'Bridge structural damage on NH-27', 'desc': 'Structural inspection required. Weight limit enforced.'},
    {'type': 'TRAFFIC', 'severity': 'MEDIUM', 'lat': 26.1500, 'lon': 91.7500,
     'title': 'Heavy congestion near Guwahati bypass', 'desc': 'Peak hour congestion. 45-minute delay expected.'},
]

VEHICLES = [
    {'id': 'MED-101', 'name': 'Medical Unit Alpha', 'type': 'AMBULANCE', 'cargo': 'Critical Medical Supplies', 'priority': 'CRITICAL'},
    {'id': 'MED-102', 'name': 'Medical Unit Beta', 'type': 'VAN', 'cargo': 'Vaccines and medicines', 'priority': 'CRITICAL'},
    {'id': 'RSC-201', 'name': 'Rescue Team Delta', 'type': 'RESCUE', 'cargo': 'Rescue equipment', 'priority': 'CRITICAL'},
    {'id': 'FD-301', 'name': 'Food Convoy Alpha', 'type': 'TRUCK', 'cargo': 'Emergency food supplies', 'priority': 'IMPORTANT'},
    {'id': 'FD-302', 'name': 'Food Convoy Beta', 'type': 'TRUCK', 'cargo': 'Rice and grain', 'priority': 'IMPORTANT'},
    {'id': 'LOG-401', 'name': 'Logistics Unit 1', 'type': 'TRUCK', 'cargo': 'General supplies', 'priority': 'NORMAL'},
    {'id': 'LOG-402', 'name': 'Logistics Unit 2', 'type': 'VAN', 'cargo': 'Communications equipment', 'priority': 'IMPORTANT'},
    {'id': 'PER-501', 'name': 'Personnel Carrier 1', 'type': 'SUV', 'cargo': 'Field officers', 'priority': 'IMPORTANT'},
    {'id': 'HEL-601', 'name': 'Air Rescue Unit', 'type': 'HELICOPTER', 'cargo': 'Aerial rescue', 'priority': 'CRITICAL'},
    {'id': 'WTR-701', 'name': 'Water Tanker 1', 'type': 'TRUCK', 'cargo': 'Drinking water', 'priority': 'IMPORTANT'},
]

DELIVERIES = [
    {
        'vehicle_id': 'MED-101',
        'cargo': 'Critical Medical Supplies - Dialysis equipment + blood',
        'priority': 'CRITICAL',
        'origin_name': 'Guwahati Medical College',
        'origin': [91.7362, 26.1445],
        'destination_name': 'Shillong Civil Hospital',
        'destination': [91.8933, 25.5788],
        'delay_min': 18,
        'status': 'IN_TRANSIT',
    },
    {
        'vehicle_id': 'MED-102',
        'cargo': 'COVID Vaccines - Temperature controlled',
        'priority': 'CRITICAL',
        'origin_name': 'Dibrugarh Health Depot',
        'origin': [94.9109, 27.4728],
        'destination_name': 'Jorhat District Hospital',
        'destination': [94.2037, 26.7509],
        'delay_min': 0,
        'status': 'IN_TRANSIT',
    },
    {
        'vehicle_id': 'FD-301',
        'cargo': 'Emergency food supplies - 5 MT rice',
        'priority': 'IMPORTANT',
        'origin_name': 'Guwahati FCI Warehouse',
        'origin': [91.7000, 26.1500],
        'destination_name': 'Senapati Relief Camp',
        'destination': [94.0166, 25.2666],
        'delay_min': 45,
        'status': 'DELAYED',
    },
    {
        'vehicle_id': 'RSC-201',
        'cargo': 'Search and rescue team + equipment',
        'priority': 'CRITICAL',
        'origin_name': 'NDRF Base Guwahati',
        'origin': [91.7600, 26.1300],
        'destination_name': 'NH-6 km 45 Incident Site',
        'destination': [91.8300, 25.8000],
        'delay_min': 0,
        'status': 'IN_TRANSIT',
    },
    {
        'vehicle_id': 'FD-302',
        'cargo': 'Emergency grain supply',
        'priority': 'IMPORTANT',
        'origin_name': 'Jorhat Depot',
        'origin': [94.2037, 26.7509],
        'destination_name': 'Dibrugarh Relief Center',
        'destination': [94.9109, 27.4728],
        'delay_min': 0,
        'status': 'PLANNED',
    },
]

def generate_segment_waypoints(waypoints: list, n_segments: int) -> list:
    """Split route into n_segments sub-segments."""
    all_points = []
    for i in range(len(waypoints) - 1):
        p1, p2 = waypoints[i], waypoints[i+1]
        steps = max(2, n_segments // len(waypoints))
        for j in range(steps):
            t = j / steps
            all_points.append([
                p1[0] + (p2[0] - p1[0]) * t,
                p1[1] + (p2[1] - p1[1]) * t,
            ])
    all_points.append(waypoints[-1])
    return all_points

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return 2*R*math.asin(math.sqrt(a))

def assign_demo_status():
    """Assign realistic status distribution: 70% open, 15% at-risk, 10% disrupted, 5% blocked."""
    r = random.random()
    if r < 0.70: return 'OPEN', 0
    if r < 0.85: return 'AT_RISK', random.uniform(25, 45)
    if r < 0.95: return 'SEVERELY_DISRUPTED', random.uniform(50, 70)
    return 'BLOCKED', random.uniform(75, 95)

def risk_level(score):
    if score < 25: return 'LOW'
    if score < 50: return 'MEDIUM'
    if score < 75: return 'HIGH'
    return 'CRITICAL'

def generate_demo_data():
    now = datetime.now(timezone.utc)
    data = {
        'states': [],
        'districts': [],
        'roads': [],
        'road_segments': [],
        'weather': [],
        'terrain': [],
        'incidents': [],
        'vehicles': [],
        'deliveries': [],
        'data_sources': [],
    }
    
    # States
    for i, s in enumerate(STATES, 1):
        data['states'].append({'id': i, **s})
    
    # Districts
    state_id_map = {s['name']: i+1 for i, s in enumerate(STATES)}
    for i, d in enumerate(DISTRICTS, 1):
        data['districts'].append({
            'id': i,
            'state_id': state_id_map.get(d['state'], 1),
            **d
        })
    
    # Roads and segments
    district_id_by_name = {d['name']: i+1 for i, d in enumerate(DISTRICTS)}
    road_id = 1
    segment_id = 1
    for corridor in ROAD_CORRIDORS:
        district_id = random.randint(1, len(DISTRICTS))
        road = {
            'id': road_id,
            'name': corridor['name'],
            'road_class': corridor['class'],
            'surface': corridor['surface'],
            'maxspeed_kmh': corridor.get('maxspeed', 60),
            'district_id': district_id,
            'waypoints': corridor['waypoints'],
            'is_demo': True,
        }
        data['roads'].append(road)
        
        # Create segments from waypoints
        wpts = corridor['waypoints']
        n_segs = max(3, len(wpts) - 1)
        all_pts = generate_segment_waypoints(wpts, n_segs * 2)
        
        seg_size = max(2, len(all_pts) // n_segs)
        for j in range(0, len(all_pts) - 1, seg_size):
            seg_pts = all_pts[j:j+seg_size+1]
            if len(seg_pts) < 2:
                continue
            status, base_risk = assign_demo_status()
            weather_risk = random.uniform(10, 60)
            terrain_risk = random.uniform(5, 50)
            incident_risk = random.uniform(0, 40)
            historical_risk = random.uniform(10, 50)
            total_risk = (base_risk*0.3 + incident_risk*0.25 + weather_risk*0.2 + terrain_risk*0.15 + historical_risk*0.1)
            
            p1, p2 = seg_pts[0], seg_pts[-1]
            length = haversine(p1[1], p1[0], p2[1], p2[0])
            
            data['road_segments'].append({
                'id': segment_id,
                'road_id': road_id,
                'sequence': j // seg_size,
                'geom_coords': seg_pts,
                'length_m': length,
                'status': status,
                'risk_score': round(total_risk, 1),
                'risk_level': risk_level(total_risk),
                'condition': random.choice(['GOOD', 'GOOD', 'FAIR', 'FAIR', 'POOR', 'VERY_POOR']),
                'speed_kmh': corridor.get('maxspeed', 60) * (0.5 if status in ('BLOCKED','SEVERELY_DISRUPTED') else 0.8),
                'weather_risk': round(weather_risk, 1),
                'terrain_risk': round(terrain_risk, 1),
                'incident_risk': round(incident_risk, 1),
                'historical_risk': round(historical_risk, 1),
                'is_demo': True,
                'last_updated': (now - timedelta(minutes=random.randint(5, 120))).isoformat(),
            })
            segment_id += 1
        road_id += 1
    
    # Weather observations
    for i, d in enumerate(DISTRICTS, 1):
        # Monsoon season rainfall: high in Meghalaya, moderate in Assam
        base_rain = {'Meghalaya': 45, 'Assam': 28, 'Manipur': 20, 'Mizoram': 18}.get(d['state'], 15)
        rainfall = base_rain + random.uniform(-10, 20)
        data['weather'].append({
            'district_id': i,
            'lat': d['lat'],
            'lon': d['lon'],
            'observed_at': now.isoformat(),
            'rainfall_mm': round(max(0, rainfall), 1),
            'temperature_c': round(random.uniform(18, 30), 1),
            'humidity_pct': round(random.uniform(70, 95), 1),
            'wind_speed_kmh': round(random.uniform(5, 30), 1),
            'source': 'open_meteo',
            'is_demo': True,
        })
    
    # Terrain
    for i, d in enumerate(DISTRICTS, 1):
        # Meghalaya/Manipur: hilly, Assam: plains
        hilly_states = ['Meghalaya', 'Manipur', 'Mizoram', 'Nagaland']
        if d['state'] in hilly_states:
            elevation = random.uniform(500, 1500)
            slope = random.uniform(20, 45)
            terrain_class = 'HILLY'
        else:
            elevation = random.uniform(50, 200)
            slope = random.uniform(2, 15)
            terrain_class = 'PLAINS'
        data['terrain'].append({
            'district_id': i,
            'lat': d['lat'],
            'lon': d['lon'],
            'elevation_m': round(elevation, 1),
            'slope_pct': round(slope, 1),
            'terrain_class': terrain_class,
            'source': 'NASA_SRTM',
        })
    
    # Incidents
    for sc in INCIDENT_SCENARIOS:
        data['incidents'].append({
            'id': str(uuid.uuid4()),
            **sc,
            'status': random.choice(['PENDING', 'VERIFIED', 'VERIFIED', 'RESOLVED']),
            'reporter_name': random.choice(['Officer Sharma', 'Officer Das', 'Officer Singh', 'Field Team Alpha']),
            'source': 'FIELD_REPORT',
            'is_demo': True,
            'created_at': (now - timedelta(hours=random.randint(1, 48))).isoformat(),
        })
    
    # Vehicles
    vehicle_positions = [
        [91.7362, 26.1445], [94.9109, 27.4728], [93.9368, 24.8170],
        [91.8933, 25.5788], [94.2037, 26.7509], [91.7200, 26.1300],
        [91.8000, 26.0500], [92.5000, 25.0000], [91.8000, 26.1200], [92.0000, 26.5000],
    ]
    for i, v in enumerate(VEHICLES):
        pos = vehicle_positions[i % len(vehicle_positions)]
        data['vehicles'].append({
            **v,
            'lon': pos[0], 'lat': pos[1],
            'speed_kmh': random.uniform(0, 60) if v['type'] != 'HELICOPTER' else 120,
            'status': random.choice(['MOVING', 'MOVING', 'STOPPED', 'DELAYED']),
            'is_demo': True, 'is_simulated': True,
        })
    
    # Deliveries
    for d in DELIVERIES:
        data['deliveries'].append({
            'id': str(uuid.uuid4()),
            **d,
            'scheduled_arrival': (now + timedelta(hours=2)).isoformat(),
            'estimated_arrival': (now + timedelta(hours=2, minutes=d['delay_min'])).isoformat(),
            'is_demo': True,
        })
    
    # Data sources registry
    data['data_sources'] = [
        {'name': 'OpenStreetMap', 'dataset': 'ROAD NETWORK', 'url': 'https://www.openstreetmap.org', 'status': 'AVAILABLE', 'mode': 'DEMO', 'coverage': 'Northeast India', 'refresh_interval': 'Weekly', 'notes': 'Road geometry via Overpass API'},
        {'name': 'Open-Meteo', 'dataset': 'WEATHER', 'url': 'https://open-meteo.com', 'status': 'AVAILABLE', 'mode': 'LIVE', 'coverage': 'Northeast India', 'refresh_interval': 'Hourly', 'notes': 'Free API, no key required'},
        {'name': 'NASA SRTM', 'dataset': 'ELEVATION / TERRAIN', 'url': 'https://srtm.csi.cgiar.org', 'status': 'AVAILABLE', 'mode': 'DEMO', 'coverage': 'Northeast India', 'refresh_interval': 'Static', 'notes': 'Public domain 30m DEM'},
        {'name': 'GADM', 'dataset': 'ADMINISTRATIVE BOUNDARIES', 'url': 'https://gadm.org', 'status': 'AVAILABLE', 'mode': 'DEMO', 'coverage': 'India states/districts', 'refresh_interval': 'Annual', 'notes': 'CC-BY-NC'},
        {'name': 'OSRM', 'dataset': 'ROUTING ENGINE', 'url': 'http://router.project-osrm.org', 'status': 'AVAILABLE', 'mode': 'DEMO', 'coverage': 'Global (OSM)', 'refresh_interval': 'Real-time', 'notes': 'Demo server only'},
        {'name': 'GDACS', 'dataset': 'DISASTER ALERTS', 'url': 'https://www.gdacs.org', 'status': 'AVAILABLE', 'mode': 'LIVE', 'coverage': 'Global', 'refresh_interval': 'Hourly', 'notes': 'Free REST API'},
        {'name': 'Demo Data Pipeline', 'dataset': 'INCIDENTS + VEHICLES', 'url': None, 'status': 'AVAILABLE', 'mode': 'DEMO', 'coverage': 'Northeast India', 'refresh_interval': 'On demand', 'notes': 'SYNTHETIC DATA - labeled clearly'},
        {'name': 'ML Model (scikit-learn)', 'dataset': 'RISK PREDICTIONS', 'url': None, 'status': 'AVAILABLE', 'mode': 'DEMO', 'coverage': 'Northeast India', 'refresh_interval': 'Per request', 'notes': 'PROTOTYPE MODEL | SYNTHETIC DATA'},
    ]
    
    return data

if __name__ == '__main__':
    print('Generating NER-RAKSHA demo data...')
    data = generate_demo_data()
    output_path = Path(__file__).parent.parent / 'data' / 'demo' / 'demo_data.json'
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2, default=str)
    print(f'Generated demo data:')
    for key, val in data.items():
        print(f'  {key}: {len(val)} records')
    print(f'Saved to: {output_path}')
