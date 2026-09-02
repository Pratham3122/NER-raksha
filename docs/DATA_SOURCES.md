# Data Sources Registry

This document catalogs the various data sources used or evaluated for the NER-RAKSHA system.

## OpenStreetMap (via Overpass API)
- **URL**: https://overpass-api.de/api/interpreter
- **Dataset**: Road Network, Infrastructure
- **What it provides**: Highly detailed road geometries, road classifications, bridges, and points of interest.
- **Format**: GeoJSON, XML
- **License**: CC-BY-SA
- **Update frequency**: Continuous (minutely updates on OSM)
- **API available**: Yes
- **API endpoint**: `https://overpass-api.de/api/interpreter`
- **Rate limits**: 1 request / 2 seconds
- **Auth required**: No
- **Limitations**: Query timeouts for very large areas, data density varies by region.
- **Production use**: Yes (Self-hosted Overpass recommended)
- **Demo use**: Yes
- **Integration status**: INTEGRATED
- **Notes**: Core backbone of our routing and map display.

## GADM
- **URL**: https://gadm.org/download_country.html
- **Dataset**: Administrative Boundaries
- **What it provides**: State, district, and sub-district polygon boundaries for India.
- **Format**: Shapefile, GeoJSON, Geopackage
- **License**: CC-BY 4.0 (Non-commercial)
- **Update frequency**: Annually / Sporadic
- **API available**: No
- **API endpoint**: N/A
- **Rate limits**: N/A
- **Auth required**: No
- **Limitations**: Non-commercial license restriction.
- **Production use**: Limited
- **Demo use**: Yes
- **Integration status**: DEMO_FALLBACK
- **Notes**: Used for rendering static district boundaries.

## Open-Meteo
- **URL**: https://open-meteo.com
- **Dataset**: Weather & Forecast Data
- **What it provides**: Hourly rainfall, temperature, wind, and historical weather data.
- **Format**: JSON
- **License**: Free for non-commercial
- **Update frequency**: Hourly/Daily
- **API available**: Yes
- **API endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Rate limits**: 10,000 requests per day (Free tier)
- **Auth required**: No (for free tier)
- **Limitations**: Model-derived data, might lack local microclimate accuracy compared to local ground stations.
- **Production use**: Yes (commercial tier)
- **Demo use**: Yes
- **Integration status**: INTEGRATED
- **Notes**: Excellent developer experience and reliable uptime.

## OSRM Public Demo
- **URL**: https://router.project-osrm.org
- **Dataset**: Routing paths based on OSM
- **What it provides**: Fastest route calculation, step-by-step directions, geometries.
- **Format**: JSON
- **License**: BSD 2-Clause (Engine) / Data is OSM
- **Update frequency**: Daily (underlying data)
- **API available**: Yes
- **API endpoint**: `https://router.project-osrm.org/route/v1/driving/`
- **Rate limits**: Unspecified fair use. Not for heavy traffic.
- **Auth required**: No
- **Limitations**: Cannot customize edge weights on the fly for risk-aware routing on the public demo server.
- **Production use**: No
- **Demo use**: Yes
- **Integration status**: DEMO_FALLBACK
- **Notes**: Used as a baseline routing comparison.

## OpenRouteService
- **URL**: https://openrouteservice.org
- **Dataset**: Advanced Routing & Isochrones
- **What it provides**: Routing with avoid polygons, isochrone generation, matrix routing.
- **Format**: JSON
- **License**: Free tier available (AGPL engine)
- **Update frequency**: Regular
- **API available**: Yes
- **API endpoint**: `https://api.openrouteservice.org/v2/directions/`
- **Rate limits**: 2000 requests / day (Free tier)
- **Auth required**: Yes (API Key)
- **Limitations**: Rate limits on free tier.
- **Production use**: Yes
- **Demo use**: Yes
- **Integration status**: NOT_INTEGRATED
- **Notes**: Strong candidate for production if custom risk logic can be mapped to avoid polygons.

## GDACS (Global Disaster Alert and Coordination System)
- **URL**: https://www.gdacs.org
- **Dataset**: Real-time Disaster Alerts
- **What it provides**: Earthquakes, cyclones, floods alerts with spatial coordinates and severity.
- **Format**: GeoJSON / RSS
- **License**: Free
- **Update frequency**: Near real-time
- **API available**: Yes
- **API endpoint**: `https://www.gdacs.org/xml/rss.xml` (also GeoJSON feeds)
- **Rate limits**: None specified, standard fair use
- **Auth required**: No
- **Limitations**: Global scope, might miss highly localized smaller incidents.
- **Production use**: Yes
- **Demo use**: Yes
- **Integration status**: DEMO_FALLBACK
- **Notes**: Useful for major catastrophic event monitoring.

## ReliefWeb
- **URL**: https://reliefweb.int
- **Dataset**: Humanitarian Situation Reports
- **What it provides**: Text-based reports and metadata on ongoing disasters.
- **Format**: JSON
- **License**: Free
- **Update frequency**: Daily
- **API available**: Yes
- **API endpoint**: `https://api.reliefweb.int/v1/reports`
- **Rate limits**: 1000 calls / day (approx)
- **Auth required**: No
- **Limitations**: Qualitative data, requires NLP to extract exact spatial impact.
- **Production use**: Yes
- **Demo use**: Yes
- **Integration status**: NOT_INTEGRATED
- **Notes**: Good for context, harder for automated risk scoring.

## NASA SRTM
- **URL**: https://srtm.csi.cgiar.org
- **Dataset**: Digital Elevation Model (DEM)
- **What it provides**: 30m resolution elevation data globally.
- **Format**: GeoTIFF
- **License**: Public Domain
- **Update frequency**: Static
- **API available**: No
- **API endpoint**: N/A
- **Rate limits**: N/A
- **Auth required**: No (via some mirrors)
- **Limitations**: Static, represents past state.
- **Production use**: Yes
- **Demo use**: Yes
- **Integration status**: NOT_INTEGRATED
- **Notes**: Necessary for calculating road slopes and landslide vulnerability.

## data.gov.in
- **URL**: https://data.gov.in
- **Dataset**: Indian Government Open Data
- **What it provides**: Various datasets including weather, census, agriculture, roads.
- **Format**: CSV, JSON, XML
- **License**: National Data Sharing and Accessibility Policy (NDSAP)
- **Update frequency**: Varies by dataset
- **API available**: Yes
- **API endpoint**: `https://api.data.gov.in/`
- **Rate limits**: Varies, requires key
- **Auth required**: Yes
- **Limitations**: Data quality and freshness can be inconsistent.
- **Production use**: Yes
- **Demo use**: Yes
- **Integration status**: NOT_INTEGRATED
- **Notes**: Useful for background socio-economic and historical data.

## NDMA
- **URL**: https://ndma.gov.in
- **Dataset**: National Disaster Updates
- **What it provides**: Official situation reports, guidelines.
- **Format**: PDF, HTML
- **License**: Government
- **Update frequency**: During active disasters
- **API available**: No
- **API endpoint**: N/A
- **Rate limits**: N/A
- **Auth required**: No
- **Limitations**: Unstructured formats, manual scraping required.
- **Production use**: Limited (Manual/Scraped)
- **Demo use**: No
- **Integration status**: NOT_INTEGRATED
- **Notes**: Authoritative but hard to automate.

## EM-DAT
- **URL**: https://www.emdat.be
- **Dataset**: International Disaster Database
- **What it provides**: Historical records of disasters and their impacts.
- **Format**: Excel, CSV
- **License**: CC-BY (requires registration)
- **Update frequency**: Periodic
- **API available**: No
- **API endpoint**: N/A
- **Rate limits**: N/A
- **Auth required**: Yes (Registration)
- **Limitations**: Coarse spatial resolution (often country or province level).
- **Production use**: Yes (for ML training)
- **Demo use**: No
- **Integration status**: NOT_INTEGRATED
- **Notes**: Crucial for building historical risk models.

## pgRouting
- **URL**: https://pgrouting.org/
- **Dataset**: Routing Algorithm Engine
- **What it provides**: SQL-based routing functions (Dijkstra, A*) on PostGIS topologies.
- **Format**: SQL/Internal DB
- **License**: GPL
- **Update frequency**: N/A (Software)
- **API available**: No (SQL interface)
- **API endpoint**: N/A
- **Rate limits**: Hardware bound
- **Auth required**: N/A
- **Limitations**: Requires setting up road topology in DB, slower than purely in-memory engines like OSRM for continental scales.
- **Production use**: Yes
- **Demo use**: Yes
- **Integration status**: DEMO_FALLBACK
- **Notes**: Best option for integrating complex, dynamic risk scores directly into the routing cost function.

## IMD (India Meteorological Department)
- **URL**: https://mausam.imd.gov.in/
- **Dataset**: Official Indian Weather Data
- **What it provides**: Forecasts, cyclone warnings, station data.
- **Format**: XML, JSON (limited), PDF
- **License**: Government
- **Update frequency**: Daily/Hourly
- **API available**: Yes (Limited/Scattered)
- **API endpoint**: Varies
- **Rate limits**: Varies
- **Auth required**: Varies
- **Limitations**: API access is historically fragmented and sometimes unreliable.
- **Production use**: Yes (if reliable feed secured)
- **Demo use**: No
- **Integration status**: NOT_INTEGRATED
- **Notes**: The most authoritative source for India, but Open-Meteo is easier for prototyping.
