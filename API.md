# RLA2 API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
No authentication required for this demonstration system.

## Response Format
All responses are JSON. Success responses include a `"success": true` field.

## Endpoints

### 1. Health Check
**Endpoint**: `GET /api/health`

**Purpose**: Verify system is running and get version info.

**Response**:
```json
{
  "status": "ok",
  "version": "1.0",
  "timestamp": "2024-05-20T10:30:45.123456"
}
```

**HTTP Status**: 200 OK

---

### 2. Get Configuration
**Endpoint**: `GET /api/config`

**Purpose**: Retrieve complete system configuration including vehicles, drivers, and constraints.

**Response**:
```json
{
  "depot": {
    "name": "Dépôt Ivry",
    "lat": 48.8145,
    "lon": 2.3871
  },
  "vehicles": [
    {
      "id": "V1",
      "name": "Scooter électrique 1",
      "type": "scooter",
      "capacity": 30,
      "range": 60,
      "fuel_per_km": 0.0,
      "speed": 25
    },
    ...
  ],
  "drivers": [
    {
      "id": "D1",
      "name": "Ahmed B.",
      "start": "07:00",
      "max_drive": 9
    },
    ...
  ],
  "time_windows": {
    "pharmacy": ["08:00", "18:00"],
    "clinic": ["07:00", "14:00"],
    "hospital": ["06:00", "12:00"]
  },
  "constraints": {
    "max_driver_hours": 9,
    "max_vehicle_age_hours": 24,
    "service_time_pharmacy": 10,
    "service_time_clinic": 15,
    "service_time_hospital": 20
  }
}
```

**HTTP Status**: 200 OK

---

### 3. Get Vehicles
**Endpoint**: `GET /api/vehicles`

**Purpose**: Get list of available vehicles.

**Response**:
```json
[
  {
    "id": "V1",
    "name": "Scooter électrique 1",
    "type": "scooter",
    "capacity": 30,
    "range": 60,
    "fuel_per_km": 0.0,
    "speed": 25
  },
  ...
]
```

**HTTP Status**: 200 OK

---

### 4. Get Drivers
**Endpoint**: `GET /api/drivers`

**Purpose**: Get list of available drivers.

**Response**:
```json
[
  {
    "id": "D1",
    "name": "Ahmed B.",
    "start": "07:00",
    "max_drive": 9
  },
  ...
]
```

**HTTP Status**: 200 OK

---

### 5. Get Sample Addresses
**Endpoint**: `GET /api/addresses`

**Purpose**: Get list of sample delivery locations in Paris area.

**Response**:
```json
[
  {
    "name": "Pharmacie du Châtelet",
    "lat": 48.8604,
    "lon": 2.3477,
    "type": "pharmacy"
  },
  {
    "name": "Clinique Saint-Antoine",
    "lat": 48.8491,
    "lon": 2.3874,
    "type": "clinic"
  },
  ...
]
```

**HTTP Status**: 200 OK

---

### 6. Plan Deliveries
**Endpoint**: `POST /api/plan`

**Purpose**: Generate optimized delivery routes for a set of deliveries.

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "deliveries": [
    {
      "id": "DEL-001",
      "name": "Pharmacie du Châtelet",
      "type": "pharmacy",
      "lat": 48.8604,
      "lon": 2.3477,
      "weight": 45,
      "priority": "normal"
    },
    {
      "id": "DEL-002",
      "name": "Hôpital Lariboisière",
      "type": "hospital",
      "lat": 48.8797,
      "lon": 2.3568,
      "weight": 200,
      "priority": "urgent"
    }
  ]
}
```

**Request Parameters**:
- `deliveries` (array, required): List of delivery objects
  - `id` (string): Unique delivery identifier
  - `name` (string): Facility name
  - `type` (string): "pharmacy", "clinic", or "hospital"
  - `lat` (float): Latitude coordinate
  - `lon` (float): Longitude coordinate
  - `weight` (integer): Weight in kilograms
  - `priority` (string, optional): "urgent", "high", or "normal" (default: derived from type)

**Response**:
```json
{
  "success": true,
  "routes": [
    {
      "id": "RT-V1",
      "vehicle": {
        "id": "V1",
        "name": "Scooter électrique 1",
        "type": "scooter",
        "capacity": 30,
        "range": 60,
        "fuel_per_km": 0.0,
        "speed": 25
      },
      "driver": {
        "id": "D1",
        "name": "Ahmed B.",
        "start": "07:00",
        "max_drive": 9
      },
      "stops": [
        {
          "id": "DEL-001",
          "name": "Pharmacie du Châtelet",
          "type": "pharmacy",
          "lat": 48.8604,
          "lon": 2.3477,
          "weight": 45,
          "sequence": 0,
          "arrival_time": "08:15",
          "departure_time": "08:25",
          "distance_from_prev": 12.5,
          "status": "ok"
        }
      ],
      "summary": {
        "total_distance": 25.3,
        "total_weight": 45,
        "departure_time": "07:00",
        "return_time": "09:30",
        "elapsed_time": "02:30",
        "drive_time": "02:00",
        "utilization_weight": 150.0,
        "utilization_time": 22.2,
        "cost_estimate": 2.50,
        "fuel_cost": 0.00,
        "num_stops": 1
      },
      "constraints": {
        "violations": [],
        "satisfied": true
      }
    }
  ],
  "unassigned": [
    {
      "id": "DEL-002",
      "name": "Hôpital Lariboisière",
      "type": "hospital",
      "lat": 48.8797,
      "lon": 2.3568,
      "weight": 200,
      "priority": "urgent"
    }
  ],
  "summary": {
    "total_deliveries": 2,
    "assigned": 1,
    "unassigned": 1,
    "routes_used": 1,
    "total_distance": 25.3,
    "total_cost": 2.50,
    "avg_utilization_weight": 150.0
  }
}
```

**HTTP Status**: 
- 200 OK (success or partial success)
- 400 Bad Request (invalid input)
- 500 Internal Server Error (processing error)

**Error Response**:
```json
{
  "success": false,
  "error": "Missing required fields in delivery"
}
```

---

### 7. Load Demo Scenario
**Endpoint**: `GET /api/demo`

**Purpose**: Load realistic demo dataset with 15 deliveries across mixed facility types.

**Response**:
```json
{
  "success": true,
  "scenario": "demo",
  "deliveries": [...],
  "routes": [...],
  "unassigned": [...],
  "depot": {...},
  "summary": {
    "total_deliveries": 15,
    "assigned": 14,
    "routes_active": 3
  }
}
```

**HTTP Status**: 200 OK

**Use Case**: Quick demonstration of system capabilities without manual data entry.

---

### 8. Load Stress Test Scenario
**Endpoint**: `GET /api/demo/stress`

**Purpose**: Load high-volume scenario with 25+ deliveries, heavy weights, and challenging constraints.

**Response**:
```json
{
  "success": true,
  "scenario": "stress_test",
  "deliveries": [...],
  "routes": [...],
  "unassigned": [...],
  "summary": {
    "total_deliveries": 25,
    "assigned": 21,
    "unassigned": 4,
    "routes_active": 5,
    "total_weight": 4250,
    "avg_weight_per_delivery": 170.0
  }
}
```

**HTTP Status**: 200 OK

**Use Case**: Test system behavior under capacity and resource constraints.

---

### 9. Analyze Route (Placeholder)
**Endpoint**: `GET /api/analyze/<route_id>`

**Purpose**: Get detailed analysis of a specific route (future feature).

**Example URL**: `GET /api/analyze/RT-V1`

**Response** (current):
```json
{
  "error": "Route analysis requires route storage implementation"
}
```

**HTTP Status**: 501 Not Implemented

---

## Data Models

### Delivery Object
```json
{
  "id": "DEL-001",
  "name": "Pharmacie du Châtelet",
  "type": "pharmacy",
  "lat": 48.8604,
  "lon": 2.3477,
  "weight": 45,
  "priority": "normal",
  "refrigerated": true
}
```

**Fields**:
- `id`: Unique identifier for the delivery
- `name`: Name of the facility
- `type`: Facility type ("pharmacy", "clinic", "hospital")
- `lat`, `lon`: GPS coordinates (WGS84)
- `weight`: Package weight in kilograms
- `priority`: Delivery urgency level
- `refrigerated`: (optional) Whether goods need temperature control

### Route Object
```json
{
  "id": "RT-V1",
  "vehicle": { ... },
  "driver": { ... },
  "stops": [ ... ],
  "summary": {
    "total_distance": 25.3,
    "total_weight": 45,
    "departure_time": "07:00",
    "return_time": "09:30",
    "elapsed_time": "02:30",
    "drive_time": "02:00",
    "utilization_weight": 150.0,
    "utilization_time": 22.2,
    "cost_estimate": 2.50,
    "fuel_cost": 0.00,
    "num_stops": 1
  },
  "constraints": {
    "violations": [],
    "satisfied": true
  }
}
```

### Stop Object
```json
{
  "id": "DEL-001",
  "name": "Pharmacie du Châtelet",
  "type": "pharmacy",
  "lat": 48.8604,
  "lon": 2.3477,
  "weight": 45,
  "sequence": 0,
  "arrival_time": "08:15",
  "departure_time": "08:25",
  "distance_from_prev": 12.5,
  "status": "ok"
}
```

---

## Error Handling

### Common Error Codes

**400 Bad Request**
```json
{
  "success": false,
  "error": "No deliveries provided"
}
```
Missing or invalid request data.

**400 Bad Request**
```json
{
  "success": false,
  "error": "Missing required fields in delivery"
}
```
Delivery object missing required fields (lat, lon, weight).

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Division by zero in cost calculation"
}
```
Processing error in planning algorithm.

---

## Rate Limiting
No rate limiting is implemented in this demonstration version.

## Pagination
No pagination is implemented. All results are returned in a single response.

## Versioning
API version: 1.0 (as returned by `/api/health`)

---

## Examples

### Example 1: Simple Delivery Planning
```bash
curl -X POST http://localhost:5000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "deliveries": [
      {
        "id": "D1",
        "name": "Test Pharmacy",
        "type": "pharmacy",
        "lat": 48.8604,
        "lon": 2.3477,
        "weight": 25
      }
    ]
  }'
```

### Example 2: Using Python Requests
```python
import requests

data = {
    "deliveries": [
        {
            "id": "D1",
            "name": "Hospital A",
            "type": "hospital",
            "lat": 48.8797,
            "lon": 2.3568,
            "weight": 150,
            "priority": "urgent"
        },
        {
            "id": "D2",
            "name": "Pharmacy B",
            "type": "pharmacy",
            "lat": 48.8604,
            "lon": 2.3477,
            "weight": 30,
            "priority": "normal"
        }
    ]
}

response = requests.post(
    "http://localhost:5000/api/plan",
    json=data
)

result = response.json()
if result["success"]:
    print(f"Routes: {len(result['routes'])}")
    for route in result['routes']:
        print(f"  - {route['vehicle']['name']}: {route['summary']['num_stops']} stops")
else:
    print(f"Error: {result['error']}")
```

### Example 3: Load and Examine Demo Data
```bash
curl http://localhost:5000/api/demo | python -m json.tool
```

---

## Notes

- All timestamps are in HH:MM format (24-hour)
- All distances are in kilometers
- All weights are in kilograms
- All costs are in euros (€)
- All coordinates use WGS84 (GPS) format
- Distance calculation uses Haversine approximation (not road network)

---

**Last Updated**: May 2026  
**API Version**: 1.0  
**Status**: Stable
