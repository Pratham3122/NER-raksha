# Risk Methodology

This document details the heuristic algorithms and scoring mechanisms used by NER-RAKSHA to quantify transport risk.

## Route Risk Formula

The overall risk score for a given route segment is calculated as a weighted sum of several factors. The maximum possible score is 100.

**Risk Score = (W1 * Road_Status_Risk) + (W2 * Incident_Proximity_Risk) + (W3 * Weather_Risk) + (W4 * Terrain_Risk) + (W5 * Historical_Risk)**

### Weights
*   **W1 (Road Status):** 0.30
*   **W2 (Incident Proximity):** 0.25
*   **W3 (Weather/Rainfall):** 0.20
*   **W4 (Terrain/Slope):** 0.15
*   **W5 (Historical Disruption):** 0.10

### 1. Road Status Risk (30%)
Based on real-time operational status of the road.
*   **OPEN:** 0 points
*   **AT_RISK:** 40 points
*   **SEVERELY_DISRUPTED:** 70 points
*   **BLOCKED:** 100 points (effectively sets edge cost to infinity in routing)

### 2. Incident Proximity Risk (25%)
Calculated based on the number and severity of active incidents within a 5km radius of the segment.
*   Calculated dynamically. Higher density and higher severity incidents increase the score up to a maximum of 100.

### 3. Weather/Rainfall Risk (20%)
Based on 24-hour forecasted or recent rainfall (in mm).
*   **0-20mm (LOW):** 10 points
*   **20-50mm (MEDIUM):** 40 points
*   **50-100mm (HIGH):** 75 points
*   **>100mm (CRITICAL):** 100 points

### 4. Terrain/Slope Risk (15%)
Based on the average slope/gradient of the road segment.
*   **<15% (LOW):** 10 points
*   **15-30% (MEDIUM):** 50 points
*   **>30% (HIGH):** 100 points

### 5. Historical Disruption Risk (10%)
Based on a rolling 30-day incident rate per segment. High frequency disruption zones get higher baseline risk.

## Risk Levels

The final composite score determines the categorical risk level presented to the user:
*   **0-25:** LOW (Green)
*   **25-50:** MEDIUM (Amber)
*   **50-75:** HIGH (Orange)
*   **75-100:** CRITICAL (Red)

## Expected Delay Model

The system estimates travel delays caused by risks.
`Expected delay per segment = base_delay * delay_multiplier`

Where `base_delay` is calculated from segment length and speed limit, and `delay_multiplier` is:
*   **OPEN:** 1.0 (No delay)
*   **AT_RISK:** 1.3 (+30% time)
*   **SEVERELY_DISRUPTED:** 2.5 (+150% time)
*   **BLOCKED:** Invalid (Route impossible)

## Route Comparison Strategies

The API offers different objective functions for pathfinding:

1.  **FASTEST:** Minimizes duration only. Ignores risk completely.
2.  **BALANCED:** Minimizes `(0.5 * normalized_duration + 0.5 * risk_score)`. Attempts to find a fast route that isn't excessively risky.
3.  **SAFEST:** Minimizes `(0.2 * normalized_duration + 0.8 * risk_score)`. Prioritizes avoiding risk above all, even if significantly slower.

## ML Integration

When the Predictive ML model is active, the static heuristic for `Road Status Risk` and `Historical Disruption Risk` can be replaced.
The ML model outputs a `disruption_probability` (0.0 to 1.0), which maps directly to a 0-100 risk score and replaces those static weights in the formula.

## Limitations

*   **Prototype Model:** This methodology is currently a heuristic prototype.
*   **Assumptions:** Assumes incident data is fresh and accurately geolocated. Assumes uniform vehicle characteristics (does not differentiate between light vehicles and heavy trucks currently).
*   **Weather resolution:** Relies on coarse grid weather data; micro-local flash floods might be missed.
