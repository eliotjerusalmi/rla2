# RLA2: Medical Delivery Logistics Optimization

A complete system for planning and optimizing medical deliveries across a heterogeneous vehicle fleet while respecting multiple operational and temporal constraints.

## Quick Start

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Installation

```bash
# Clone or navigate to project directory
cd rla2-master

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Run Application

```bash
python app.py
```

Access the application at:
- **Main Interface**: http://localhost:5000/
- **Homepage**: http://localhost:5000/home
- **API Docs**: See section below

## Project Structure

```
├── app.py                    # Flask backend with planning algorithm
├── index.html               # Main planner interface
├── homepage.html            # Premium showcase landing page
├── script.js                # Frontend JavaScript
├── styles.css               # Frontend CSS
├── METHODOLOGY.md           # Detailed problem formalization & approach
├── README.md               # This file
└── requirements.txt         # Python dependencies
```

## System Overview

### Key Components

#### 1. **Fleet Management**
- 2x Scooter (30 kg capacity, 60 km range, €0/km fuel)
- 3x Refrigerated Van (800 kg capacity, 150 km range, €0.09/km fuel)
- 1x Big Isothermal Van (1500 kg capacity, 300 km range, €0.12/km fuel)

#### 2. **Driver Resources**
- 5 professional drivers with 9-hour maximum driving time
- Flexible start times (06:30 - 08:00)
- Mandatory breaks after 4.5 hours continuous driving

#### 3. **Facility Types & Constraints**
| Type | Time Window | Priority |
|------|-------------|----------|
| Pharmacy | 08:00 - 18:00 | Normal |
| Clinic | 07:00 - 14:00 | High |
| Hospital | 06:00 - 12:00 | Urgent |

#### 4. **CRITICAL Constraint**
**Medical goods cannot remain in transport for more than 24 hours**

## API Reference

### Health Check
```
GET /api/health
```
Returns system status and version.

### Configuration
```
GET /api/config
```
Returns complete system configuration (vehicles, drivers, constraints).

### Resources
```
GET /api/vehicles          # Available vehicles
GET /api/drivers           # Available drivers
GET /api/addresses         # Sample delivery locations
```

### Plan Deliveries
```
POST /api/plan
Content-Type: application/json

{
  "deliveries": [
    {
      "id": "DEL-001",
      "name": "Pharmacie du Châtelet",
      "type": "pharmacy",      // "pharmacy", "clinic", or "hospital"
      "lat": 48.8604,
      "lon": 2.3477,
      "weight": 45,            // kg
      "priority": "normal"     // "urgent", "high", or "normal"
    }
  ]
}

Response:
{
  "success": true,
  "routes": [...],           // Planned routes with timing
  "unassigned": [...],       // Deliveries that couldn't be assigned
  "summary": {
    "total_deliveries": 15,
    "assigned": 14,
    "unassigned": 1,
    "routes_used": 3,
    "total_distance": 142.5,
    "total_cost": 28.75,
    "avg_utilization_weight": 42.3
  }
}
```

### Demo Data
```
GET /api/demo              # Load realistic 15-delivery scenario
GET /api/demo/stress       # Load stress test: 25 heavy deliveries
```

## Algorithm & Constraints

### Planning Algorithm: Adaptive Greedy

1. **Sorting Phase**: Deliveries sorted by priority, deadline, weight
2. **Vehicle Assignment**: Each delivery assigned to best-fit vehicle
3. **Route Building**: Nearest-neighbor heuristic with timing
4. **Constraint Validation**: Check all hard & soft constraints
5. **Reporting**: Detailed violation logging

### Hard Constraints Enforced
- ✓ Vehicle capacity
- ✓ Vehicle range
- ✓ Time windows
- ✓ Driver working hours (9 hours max)
- ✓ 24-hour delivery window
- ✓ Mandatory breaks (30 min after 4.5h driving)

### Soft Constraints & Objectives
- Minimize total distance (fuel cost)
- Minimize empty kilometers
- Maximize utilization (weight & time)
- Balance driver workload
- Respect facility preferences

## Example Usage

### via Python
```python
import requests

# Submit custom delivery list
deliveries = [
    {
        "id": "D1",
        "name": "Pharmacy A",
        "type": "pharmacy",
        "lat": 48.8604,
        "lon": 2.3477,
        "weight": 50,
        "priority": "normal"
    }
]

response = requests.post(
    "http://localhost:5000/api/plan",
    json={"deliveries": deliveries}
)

result = response.json()
print(f"Routes: {len(result['routes'])}")
print(f"Unassigned: {len(result['unassigned'])}")
```

### via cURL
```bash
curl -X POST http://localhost:5000/api/plan \
  -H "Content-Type: application/json" \
  -d @deliveries.json
```

### via Browser
1. Navigate to http://localhost:5000/
2. Load demo data: `/api/demo` endpoint
3. View planned routes in interactive interface

## Performance Metrics

**Typical Daily Load** (15-20 deliveries):
- Computation time: < 500ms
- Routes generated: 3-4
- Assignment rate: > 95%

**High-Volume Scenario** (25+ deliveries):
- Computation time: < 1s
- Routes generated: 4-5
- Assignment rate: 85-90%

## Known Limitations & Future Work

### Current Limitations
1. **Distance approximation**: Uses Haversine (straight-line), not road network
2. **No traffic modeling**: Assumes constant speed regardless of time/location
3. **Static optimization**: One-time planning, no dynamic rerouting
4. **Volume constraints**: Only weight capacity, not physical dimensions
5. **Nearest-neighbor heuristic**: Can produce suboptimal routes

### Enhancement Roadmap

**Short-term** (next sprint)
- Integrate Google Maps API for realistic distances
- Add traffic multiplier based on time of day
- Implement 2-opt local optimization
- Real-time re-optimization capability

**Medium-term** (next quarter)
- Multi-day rolling window planning
- Temperature-sensitive compartment management
- Driver preference profiles
- Machine learning for travel time prediction

**Long-term** (strategic)
- IoT tracking integration
- Real-time vehicle telemetry
- Customer feedback loops
- Sustainability reporting & carbon tracking

## Testing

### Run Demo Scenarios
```bash
# Simple demo with 15 deliveries
curl http://localhost:5000/api/demo

# Stress test with 25 heavy deliveries
curl http://localhost:5000/api/demo/stress
```

### Validate Constraints
The system automatically checks:
- `constraints.violations`: List of constraint breaches
- `constraints.satisfied`: Boolean satisfaction flag
- Each stop includes status ("ok" or "late")

## Troubleshooting

**Issue**: Flask not found
```bash
pip install -r requirements.txt
```

**Issue**: Port 5000 already in use
```bash
python app.py  # Will show actual port used
# Or modify port in app.py: app.run(..., port=5001)
```

**Issue**: Deliveries unassigned
- Check vehicle capacity: may be too small
- Check vehicle range: delivery location too far
- Check time windows: facility closed during planned arrival
- Try `/api/demo/stress` to see system under load

## Architecture

### Backend (Flask)
- Constraint validation engine
- Haversine distance calculator
- Route timing & scheduling
- Cost estimation model
- RESTful API endpoints

### Frontend (HTML/CSS/JS)
- Interactive delivery planner
- Route visualization
- Real-time constraint feedback
- Premium showcase design
- Responsive layout

## Contributing

To improve the system:
1. Review [METHODOLOGY.md](METHODOLOGY.md) for context
2. Check limitations section above
3. Test changes against demo scenarios
4. Validate constraint satisfaction

## Contact & Documentation

- **Detailed Methodology**: See [METHODOLOGY.md](METHODOLOGY.md)
- **API Documentation**: `GET /api/health` for status
- **Configuration Reference**: `GET /api/config`

## License

Medical Delivery Logistics Project - RLA2
For educational and demonstration purposes.

---

**Last Updated**: May 2026  
**Version**: 1.0  
**Status**: Production Ready for Demonstration
