# Research Document for NER-RAKSHA

This document outlines the research into various data sources and APIs for the NER-RAKSHA (Northeast India Regional Logistics & Accessibility Command Center for Risk-Aware Transportation) project.

## Section 1: Road Network Data

*   **OpenStreetMap + Overpass API**
    *   **URL:** https://overpass-api.de/api/interpreter
    *   **Details:** Free, CC-BY-SA license. Can query Northeast India highways/roads by bounding box. Returns GeoJSON/XML.
    *   **Rate limit:** 1 request / 2 seconds.
    *   **Production Viability:** Viable for production, though dedicated Overpass instances are recommended for heavy usage.
*   **Bhuvan NRSC**
    *   **URL:** https://bhuvan.nrsc.gov.in
    *   **Details:** ISRO's national GIS portal. Provides road shapefiles for India. Some layers require registration. Government license.
*   **National Highways Authority of India (NHAI)**
    *   **URL:** https://www.nhai.gov.in
    *   **Details:** Publishes highway data. Limited API, mostly PDF reports.

## Section 2: Administrative Boundaries

*   **GADM India**
    *   **URL:** https://gadm.org/download_country.html
    *   **Details:** CC-BY 4.0 non-commercial. State and district polygons in shapefile/GeoJSON format. Static data (updated ~annually).
*   **data.gov.in**
    *   **URL:** https://data.gov.in
    *   **Details:** Government of India open data portal. Various administrative datasets. NLP API available. NGODC license.
*   **Census of India**
    *   **Details:** District boundaries available, static.

## Section 3: Elevation & Terrain

*   **NASA SRTM**
    *   **URL:** https://srtm.csi.cgiar.org and https://earthexplorer.usgs.gov
    *   **Details:** 30m resolution, GeoTIFF format. Public Domain. Full Northeast India coverage. No API key needed for public download.
*   **ALOS World 3D**
    *   **Details:** Provided by JAXA. 30m resolution, free for research.
*   **Copernicus DEM**
    *   **Details:** Provided by ESA. 30m resolution, free.

## Section 4: Weather & Rainfall

*   **Open-Meteo**
    *   **URL:** https://open-meteo.com
    *   **Details:** Free, no API key required for non-commercial use. Hourly rainfall/temperature forecast + historical data. JSON REST API. 1000 req/day free. Production viable for demo.
*   **IMD Open Data**
    *   **URL:** https://mausam.imd.gov.in
    *   **Details:** India Meteorological Department. Limited public API, some datasets on data.gov.in in XML/JSON format.
*   **OpenWeatherMap**
    *   **URL:** https://openweathermap.org/api
    *   **Details:** Free tier 60 calls/min, requires API key. Good rain data.
*   **NOAA Global Surface Summary**
    *   **Details:** Public archive, historical only.

## Section 5: Disaster & Incident Data

*   **NDMA (National Disaster Management Authority)**
    *   **URL:** https://ndma.gov.in
    *   **Details:** Publishes situation reports, no live API.
*   **OSDMA Odisha**
    *   **Details:** State disaster API example.
*   **EM-DAT**
    *   **URL:** https://www.emdat.be
    *   **Details:** Historical disaster database, requires registration, CC-BY.
*   **GDACS**
    *   **URL:** https://www.gdacs.org
    *   **Details:** Global Disaster Alert and Coordination System. REST API, free. Returns flood/cyclone/earthquake events.
*   **FloodList**
    *   **URL:** https://floodlist.com
    *   **Details:** News-based, no API.
*   **ReliefWeb**
    *   **URL:** https://reliefweb.int/api/v1
    *   **Details:** Free API for disaster situation reports.

## Section 6: Routing Engines

*   **OSRM Public Demo**
    *   **URL:** https://router.project-osrm.org
    *   **Details:** Uses OSM data, REST API. Free for demo, not for production high-volume. Returns JSON route with geometry, distance, duration.
*   **Valhalla**
    *   **Details:** Open source routing engine, self-hostable. Supports matrix routing, turn-by-turn.
*   **OpenRouteService**
    *   **URL:** https://openrouteservice.org
    *   **Details:** Free tier 2000 req/day, requires API key. Good for India.
*   **GraphHopper**
    *   **URL:** https://graphhopper.com
    *   **Details:** Free tier available, good OSM coverage.
*   **pgRouting**
    *   **Details:** PostgreSQL extension for in-database routing on a road graph. No external API needed.

## Section 7: ML/AI Datasets

*   **Kaggle India Road Accidents:** Various datasets, licenses vary, CSV format.
*   **WHO Global Road Safety:** Country-level statistics.
*   **NHIDCL:** National Highways and Infrastructure Development Corporation for Northeast India highway status.
*   **IMD Historical Rainfall:** CSV available on data.gov.in for district-wise monthly rainfall.
*   **NDRF:** Annual reports with incident statistics.

## Section 8: GIS Libraries

*   **Leaflet.js:** BSD-2, production ready, great OSM integration.
*   **react-leaflet:** Leaflet wrapper for React, MIT.
*   **PostGIS:** GPL, spatial extension for PostgreSQL.
*   **Shapely (Python):** BSD, geometry operations.
*   **GeoPandas (Python):** BSD, geospatial DataFrames.
*   **Turf.js:** MIT, client-side GIS operations.

## Section 9: Open APIs Verified

*   **Overpass API:** Available, uses custom QL via POST/GET, returns valid JSON/XML.
*   **Open-Meteo:** Available, standard REST GET, returns valid JSON with structured forecast arrays.
*   **GDACS:** Available, RSS/GeoJSON endpoints, reliable parsing.
*   **OSRM:** Available, REST GET, returns valid JSON routing object.

## Section 10: Summary Table

| Source | Dataset | License | Format | API | Rate Limit | Production? | Demo? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| OpenStreetMap | Road Network | CC-BY-SA | GeoJSON | Yes | 1 req/2s | Yes | Yes |
| GADM | Admin Bounds | CC-BY 4.0 | Shapefile | No | N/A | Yes | Yes |
| Open-Meteo | Weather | Free | JSON | Yes | 1000/day | Yes | Yes |
| OSRM | Routing | Free Demo| JSON | Yes | Fair Use | No | Yes |
| GDACS | Disasters | Free | GeoJSON | Yes | None | Yes | Yes |
| NASA SRTM | Elevation | Public Dom| GeoTIFF | No | None | Yes | Yes |
| data.gov.in | Various | NGODC | Various | Yes | Varies | Yes | Yes |
| EM-DAT | Historical | CC-BY | CSV | No | N/A | Yes | Yes |
| pgRouting | Routing | GPL | DB Ext | No | N/A | Yes | No |
