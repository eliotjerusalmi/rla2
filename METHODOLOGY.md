# RLA2: Medical Delivery Logistics Optimization
## Methodology & Problem Formalization

---

## Table of Contents
1. [Problem Understanding](#problem-understanding)
2. [System Context & Constraints](#system-context--constraints)
3. [Data Model](#data-model)
4. [Resolution Strategy](#resolution-strategy)
5. [Implementation Details](#implementation-details)
6. [Limitations & Future Improvements](#limitations--future-improvements)

---

## Problem Understanding

### Context
**MediDéliv** is a medical delivery company operating in the Paris metropolitan area, delivering critical medical goods (medicines, supplies) to pharmacies, clinics, and hospitals. The core challenge is organizing daily deliveries while respecting multiple, sometimes conflicting constraints.

### Key Stakeholders
- **Company**: Needs cost-effective, reliable operations
- **Drivers**: Have working hour limits and rest requirements
- **Customers** (Facilities): Have time-window expectations and service requirements
- **Patients**: Depend on timely delivery of medical products

### Critical Business Constraint
**Medical products cannot remain in a transport vehicle for more than 24 hours.** This fundamentally shapes delivery sequencing and assignment decisions.

---

## System Context & Constraints

### Vehicle Fleet (Heterogeneous)
The company operates three vehicle types:

| Type | Model | Capacity | Range | Speed | Fuel/km | Strength | Weakness |
|------|-------|----------|-------|-------|---------|----------|----------|
| **Scooter** | Electric 50cc | 30 kg | 60 km | 25 km/h | €0/km | Agile in city, no fuel cost | Low capacity, short range |
| **Van** | Refrigerated | 800 kg | 150 km | 40 km/h | €0.09/km | Good capacity, moderate range | Fuel cost, city constraints |
| **Big Van** | Isothermal | 1500 kg | 300 km | 35 km/h | €0.12/km | Maximum capacity & range | Highest fuel cost |

### Driver Constraints
- **Working hours**: 9 hours maximum driving time per day
- **Start times**: Vary by driver (earliest 06:30, latest 08:00)
- **Rest periods**: Implicitly managed via max driving time
- **Availability**: 5 drivers total (can be extended)

### Delivery Facility Constraints
Three facility types with distinct characteristics:

| Type | Count | Time Window | Urgency | Typical Load |
|------|-------|-------------|---------|--------------|
| **Pharmacy** | Most | 08:00 - 18:00 | Medium | 20-100 kg |
| **Clinic** | Medium | 07:00 - 14:00 | High | 50-200 kg |
| **Hospital** | Fewer | 06:00 - 12:00 | Urgent | 100-400 kg |

### Operational Constraints
1. **Capacity constraints**: Vehicle load ≤ vehicle capacity
2. **Range constraints**: Total round-trip distance ≤ vehicle range + margin
3. **Time window constraints**: Arrival ≤ facility closing time
4. **24-hour constraint**: Pickup to delivery ≤ 24 hours
5. **Temporal sequence**: Deliveries must respect priority and urgency

---

## Data Model

### Core Entities

#### 1. Depot (Origin Point)
```python
{
  "id": "D",
  "name": "Dépôt Ivry",
  "lat": 48.8145,
  "lon": 2.3871
}
```

#### 2. Vehicle
```python
{
  "id": "V1",
  "type": "scooter|van|bigvan",
  "name": "Scooter électrique 1",
  "capacity": 30,        # kg
  "range": 60,           # km
  "fuel_per_km": 0.0,    # € per km
  "speed": 25            # km/h average
}
```

#### 3. Driver
```python
{
  "id": "D1",
  "name": "Ahmed B.",
  "start_time": "07:00",      # HH:MM
  "max_drive_hours": 9,       # hours
  "available_from": "2024-05-20",
  "available_until": "2024-05-20"
}
```

#### 4. Delivery
```python
{
  "id": "DEL-001",
  "facility_name": "Pharmacie du Châtelet",
  "facility_type": "pharmacy|clinic|hospital",
  "lat": 48.8604,
  "lon": 2.3477,
  "weight": 45,              # kg
  "time_window_start": "08:00",    # HH:MM
  "time_window_end": "18:00",
  "priority": 0,             # 0 = urgent, 1 = high, 2 = normal, 3 = low
  "pickup_time": "2024-05-20 07:00",  # When package enters vehicle
  "status": "pending|assigned|delivered"
}
```

#### 5. Route (Result)
```python
{
  "id": "RT-001",
  "driver_id": "D1",
  "vehicle_id": "V1",
  "stops": [
    {"sequence": 0, "type": "depot", "arrival": "07:00", "lat": 48.8145, "lon": 2.3871},
    {"sequence": 1, "delivery_id": "DEL-001", "arrival": "08:15", "duration": 15},
    ...
  ],
  "metrics": {
    "total_distance": 24.5,  # km
    "total_time": 480,       # minutes
    "total_weight": 120,     # kg
    "load_utilization": 0.4,
    "time_utilization": 0.88,
    "cost": 2.21,            # € (fuel + time estimate)
    "violations": []         # Constraint violations if any
  }
}
```

---

## Resolution Strategy

### Algorithm: Adaptive Greedy with Constraint Validation

#### Phase 1: Sorting & Prioritization
Deliveries are sorted by:
1. **Priority level** (urgent < high < normal < low)
2. **Facility type urgency** (hospital < clinic < pharmacy)
3. **Time window deadline** (earliest deadline first)
4. **Pickup-to-delivery deadline** (24-hour constraint)

#### Phase 2: Feasibility Check
For each delivery, determine which vehicles can physically handle it:
- Capacity: `weight ≤ vehicle_capacity`
- Range: `2 × distance_to_facility ≤ vehicle_range`

#### Phase 3: Vehicle-Driver Assignment
For each feasible vehicle-driver combination:
- Check: Driver available at start time
- Check: Remaining driving hours > estimated trip time
- Check: Facility time window overlaps with driver schedule
- Score by efficiency: (distance, time, cost, utilization)

#### Phase 4: Route Building (Per Vehicle)
Using nearest-neighbor heuristic:
1. Start from depot
2. From current location, find closest unassigned delivery in vehicle's assigned list
3. Check constraint feasibility (still within 24h, time window, etc.)
4. Add to route; update weight, time, distance
5. Repeat until no more deliveries can be added
6. Return to depot

#### Phase 5: Constraint Validation & Reporting
For each route, verify:
- ✓ All deliveries picked up within 24 hours of delivery
- ✓ All time windows respected
- ✓ Vehicle capacity not exceeded at any point
- ✓ Driver driving time ≤ 9 hours
- ✓ Arrival back at depot within operating hours

---

## Implementation Details

### Distance Calculation
**Haversine formula** approximates great-circle distance on Earth:
```
d = 2R × arcsin(√[sin²(Δlat/2) + cos(lat₁)cos(lat₂)sin²(Δlon/2)])
```
Where R = 6371 km (Earth's radius)

**Assumption**: Approximates road distance reasonably well for urban Paris area.

### Time Estimation
- **Base driving time**: `distance / speed` (in vehicle's average speed)
- **Facility service time**: ~10-15 minutes per stop
- **Total trip time**: Sum of all driving + service times

### Cost Model
```
Cost = (distance × fuel_per_km) + (time × €0.15/min labor estimate)
```

---

## Limitations & Future Improvements

### Current Limitations

1. **Distance Approximation**: Haversine uses as-the-crow-flies distance, not road network
   - **Fix**: Integrate Google Maps API or OpenRouteService for realistic distances

2. **Traffic Modeling**: No traffic conditions considered
   - **Fix**: Add time-of-day traffic multipliers or API integration

3. **Vehicle Utilization**: Only considers weight capacity, not volume or compartments
   - **Fix**: Track 3D volume constraints and temperature-sensitive compartments

4. **No Dynamic Rerouting**: Algorithm is deterministic, one-time planning
   - **Fix**: Implement real-time adjustment for new orders or delays

5. **Simple Nearest-Neighbor**: Known to produce suboptimal routes
   - **Fix**: Add 2-opt, 3-opt local search improvements

6. **No Soft Constraints**: Cannot express preferences like "prefer green vehicles"
   - **Fix**: Add weighted scoring for sustainability metrics

### Future Enhancement Paths

#### Short-term (2-3 sprints)
- [ ] Integrate real map data (Google Maps, OpenRouteService)
- [ ] Add traffic flow models
- [ ] Implement 2-opt local search optimization
- [ ] Create driver workload balancing
- [ ] Add customer time-window flexibility scoring

#### Medium-term (1-2 quarters)
- [ ] Multi-day planning (rolling 7-day outlook)
- [ ] Dynamic re-optimization for new orders
- [ ] Temperature/compartment constraints for sensitive goods
- [ ] Driver preference profiles (routes, break locations)
- [ ] Machine learning for travel time prediction

#### Long-term (strategic)
- [ ] Real-time vehicle tracking & communication
- [ ] IoT sensors on vehicles (temperature, location)
- [ ] Customer feedback loop (actual vs. predicted times)
- [ ] Sustainability reporting & carbon tracking
- [ ] Integration with customer order management systems

---

## Testing Strategy

### Test Scenarios

**Scenario 1: Normal Daily Load**
- 20 deliveries: 12 pharmacies, 5 clinics, 3 hospitals
- All time windows standard
- Expected: 3-4 routes, all constraints satisfied

**Scenario 2: Rush Hour / Urgent Orders**
- 15 deliveries, 8 marked "urgent"
- Tight time windows
- Expected: More routes, higher vehicle utilization

**Scenario 3: Capacity Stress**
- Heavy loads (800+ kg total)
- Only big van suitable
- Expected: Limited options, possible rejection or rescheduling

**Scenario 4: Edge Case: 24-Hour Constraint**
- Late pickup, earliest delivery must be ≤ 24 hours
- Expected: Constraint violation detection or priority rerouting

---

## Conclusion

This system balances **operational realism** with **implementational simplicity**. The greedy algorithm with constraints provides:
- ✓ Transparent, debuggable decisions
- ✓ Fast computation (<1 second for typical daily load)
- ✓ Clear constraint satisfaction reporting
- ✓ Foundation for incremental optimization

Success is measured not by "perfect" optimality, but by **reliable, constraint-respecting operations** that serve the real medical delivery business.
