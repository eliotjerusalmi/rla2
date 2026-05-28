# RLA2 - Quick Start Guide

Get the medical delivery logistics planner running in 2 minutes.

## Prerequisites
- Python 3.8 or higher
- pip (included with Python)
- A web browser

## Installation

### Step 1: Navigate to Project
```bash
cd "c:\Users\yassi\Downloads\rla2-master (1)\rla2-master"
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

This installs Flask and required dependencies.

### Step 3: Run Application
```bash
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
```

## Access the Application

### Option 1: Web Interface
1. Open browser
2. Go to: http://localhost:5000/

### Option 2: Homepage Showcase
- Go to: http://localhost:5000/home

### Option 3: API Testing
```bash
# Test demo scenario
curl http://localhost:5000/api/demo

# Test system health
curl http://localhost:5000/api/health
```

## Quick Test: Demo Scenario

### Via Browser
1. Open http://localhost:5000/
2. Click "Load Demo Data" or navigate to http://localhost:5000/api/demo
3. Review planned routes in response

### Via Command Line
```bash
curl http://localhost:5000/api/demo | python -m json.tool
```

Expected output: 15 deliveries planned into 3-4 routes with ~95% assignment rate.

## Key Features to Explore

### 1. View System Configuration
```bash
curl http://localhost:5000/api/config | python -m json.tool
```
Shows vehicles, drivers, facilities, time windows, and constraints.

### 2. Plan Custom Deliveries
```bash
curl -X POST http://localhost:5000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "deliveries": [
      {
        "id": "D1",
        "name": "Hôpital Test",
        "type": "hospital",
        "lat": 48.8797,
        "lon": 2.3568,
        "weight": 150,
        "priority": "urgent"
      }
    ]
  }' | python -m json.tool
```

### 3. Stress Test
```bash
curl http://localhost:5000/api/demo/stress | python -m json.tool
```
Tests system with 25 heavy deliveries to see capacity limits.

## Understanding the Output

### Route Structure
Each returned route includes:
- **Vehicle**: Name, type, capacity
- **Driver**: Name, start time
- **Stops**: Sequence, timing, distances
- **Summary**: Total distance, weight, cost, utilization
- **Constraints**: Violations list, satisfied flag

### Key Metrics
```json
{
  "summary": {
    "total_distance": 142.5,           // km
    "total_weight": 450,               // kg
    "departure_time": "07:00",         // HH:MM
    "return_time": "17:30",            // HH:MM
    "elapsed_time": "10:30",           // Total time
    "drive_time": "08:45",             // Pure driving
    "utilization_weight": 56.2,        // % of capacity
    "cost_estimate": 28.75,            // €
    "num_stops": 12                    // Deliveries
  }
}
```

## Documentation

- **Full Setup**: See [README.md](README.md)
- **Detailed Method**: See [METHODOLOGY.md](METHODOLOGY.md)
- **API Reference**: See [API.md](API.md)
- **Project Overview**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

## Troubleshooting

### Port Already in Use
```bash
# Use different port
# Edit app.py, change last line:
# app.run(debug=True, host="0.0.0.0", port=5001)
```

### Flask Not Found
```bash
pip install Flask==2.3.3
```

### Import Errors
```bash
# Reinstall all dependencies
pip install -r requirements.txt --force-reinstall
```

## Next Steps

1. **Understand the Problem**
   - Read METHODOLOGY.md (15 min)
   - Review constraints section
   - Understand the 24-hour constraint

2. **Explore the API**
   - Test `/api/demo` endpoint
   - Try `/api/demo/stress` for high volume
   - Create custom delivery sets

3. **Review the Code**
   - Read app.py (well-documented)
   - Look at plan_deliveries() function
   - Check constraint validation logic

4. **Extend the System**
   - Add more vehicles or drivers
   - Modify facility locations
   - Adjust time windows
   - Implement 2-opt optimization

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Main UI |
| `/home` | GET | Homepage showcase |
| `/api/health` | GET | System status |
| `/api/config` | GET | System configuration |
| `/api/vehicles` | GET | Available vehicles |
| `/api/drivers` | GET | Available drivers |
| `/api/addresses` | GET | Sample locations |
| `/api/plan` | POST | Plan deliveries |
| `/api/demo` | GET | Load 15-delivery scenario |
| `/api/demo/stress` | GET | Load 25-delivery stress test |

## Common Tasks

### Load Demo & View Routes
```bash
curl http://localhost:5000/api/demo | python -c \
  "import sys, json; data = json.load(sys.stdin); 
   print(f'Routes: {len(data[\"routes\"])}'); 
   print(f'Unassigned: {len(data[\"unassigned\"])}')"
```

### Plan Specific Deliveries
Create file `deliveries.json`:
```json
{
  "deliveries": [
    {
      "id": "D1",
      "name": "Pharmacy A",
      "type": "pharmacy",
      "lat": 48.8604,
      "lon": 2.3477,
      "weight": 30
    },
    {
      "id": "D2",
      "name": "Hospital B",
      "type": "hospital",
      "lat": 48.8797,
      "lon": 2.3568,
      "weight": 200,
      "priority": "urgent"
    }
  ]
}
```

Then submit:
```bash
curl -X POST http://localhost:5000/api/plan -d @deliveries.json
```

### Check Response Status
```bash
curl -w "Status: %{http_code}\n" http://localhost:5000/api/health
```

## Performance Notes

- **Small load** (5 deliveries): ~50ms
- **Medium load** (15 deliveries): ~150ms
- **Heavy load** (25 deliveries): ~400ms

All computation happens server-side; response times depend on network and system load.

## Getting Help

1. Check **README.md** for installation issues
2. Review **METHODOLOGY.md** for algorithm questions
3. See **API.md** for endpoint details
4. Read **PROJECT_SUMMARY.md** for overview

## Support

For issues or questions about the system:
1. Check the Limitations section in METHODOLOGY.md
2. Review constraint definitions in API.md
3. Examine test data scenarios in test_data.json
4. Study the algorithm implementation in app.py

---

**Version**: 1.0  
**Last Updated**: May 2026  
**Status**: Ready to Use ✓
