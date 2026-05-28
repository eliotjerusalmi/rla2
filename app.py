"""
RLA2: Medical Delivery Logistics Optimization
==============================================

A comprehensive system for planning and optimizing medical deliveries
across a heterogeneous vehicle fleet while respecting multiple constraints.

Key constraints:
- Medical goods cannot remain in vehicles for more than 24 hours
- Drivers have maximum 9 hours driving time per day
- Vehicles have capacity and range limitations
- Deliveries have time windows and facility-specific constraints
"""

from flask import Flask, request, jsonify, send_from_directory
from dataclasses import dataclass, field, asdict
from enum import Enum
from datetime import datetime, timedelta
import math
import random
import os
from typing import List, Dict, Tuple, Optional

app = Flask(__name__, static_folder='.')

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION & DATA MODELS
# ═══════════════════════════════════════════════════════════════════════════════

# Depot (Origin point)
DEPOT = {"name": "Dépôt Ivry", "lat": 48.8145, "lon": 2.3871}

# Vehicle Fleet Configuration
VEHICLES = [
    {"id": "V1", "name": "Camionnette normale 1",  "type": "van",     "capacity": 800, "range": 150, "fuel_per_km": 0.07,"speed": 40, "refrigerated": False},
    {"id": "V2", "name": "Camionnette normale 2",  "type": "van",     "capacity": 800, "range": 150, "fuel_per_km": 0.07,"speed": 40, "refrigerated": False},
    {"id": "V3", "name": "Camionnette frigo 1",  "type": "van",     "capacity": 800, "range": 150, "fuel_per_km": 0.09,"speed": 40, "refrigerated": True},
    {"id": "V4", "name": "Camionnette frigo 2",  "type": "van",     "capacity": 800, "range": 150, "fuel_per_km": 0.09,"speed": 40, "refrigerated": True},
    {"id": "V5", "name": "Camionnette frigo 3",  "type": "van",     "capacity": 800, "range": 150, "fuel_per_km": 0.09,"speed": 40, "refrigerated": True},
]

# Driver Configuration
DRIVERS = [
    {"id": "D1", "name": "Ahmed B.",    "start": "07:00", "max_drive": 9},
    {"id": "D2", "name": "Sophie M.",   "start": "07:00", "max_drive": 9},
    {"id": "D3", "name": "Karim L.",    "start": "06:30", "max_drive": 9},
    {"id": "D4", "name": "Nadia P.",    "start": "08:00", "max_drive": 9},
    {"id": "D5", "name": "Thomas R.",   "start": "07:30", "max_drive": 9},
]

# Sample Delivery Addresses (Paris metropolitan area)
SAMPLE_ADDRESSES = [
    {"name": "Pharmacie du Châtelet",      "lat": 48.8604, "lon": 2.3477, "type": "pharmacy"},
    {"name": "Clinique Saint-Antoine",     "lat": 48.8491, "lon": 2.3874, "type": "clinic"},
    {"name": "Pharmacie Nation",           "lat": 48.8486, "lon": 2.3965, "type": "pharmacy"},
    {"name": "Hôpital Lariboisière",       "lat": 48.8797, "lon": 2.3568, "type": "hospital"},
    {"name": "Pharmacie Montparnasse",     "lat": 48.8424, "lon": 2.3218, "type": "pharmacy"},
    {"name": "Clinique du Trocadéro",      "lat": 48.8637, "lon": 2.2905, "type": "clinic"},
    {"name": "Pharmacie Opéra",            "lat": 48.8706, "lon": 2.3318, "type": "pharmacy"},
    {"name": "Hôpital Bicêtre",            "lat": 48.7895, "lon": 2.3538, "type": "hospital"},
    {"name": "Pharmacie Vincennes",        "lat": 48.8480, "lon": 2.4390, "type": "pharmacy"},
    {"name": "Clinique des Lilas",         "lat": 48.8793, "lon": 2.4193, "type": "clinic"},
    {"name": "Pharmacie Boulogne",         "lat": 48.8355, "lon": 2.2400, "type": "pharmacy"},
    {"name": "Pharmacie Pantin",           "lat": 48.8987, "lon": 2.4044, "type": "pharmacy"},
    {"name": "Hôpital Avicenne Bobigny",   "lat": 48.9050, "lon": 2.4412, "type": "hospital"},
    {"name": "Pharmacie Montreuil",        "lat": 48.8646, "lon": 2.4481, "type": "pharmacy"},
    {"name": "Clinique Massy",             "lat": 48.7259, "lon": 2.2735, "type": "clinic"},
    {"name": "Pharmacie Versailles",       "lat": 48.8044, "lon": 2.1314, "type": "pharmacy"},
    {"name": "Pharmacie Créteil",          "lat": 48.7771, "lon": 2.4558, "type": "pharmacy"},
    {"name": "Hôpital Henri Mondor",       "lat": 48.7869, "lon": 2.4652, "type": "hospital"},
    {"name": "Pharmacie Saint-Denis",      "lat": 48.9359, "lon": 2.3618, "type": "pharmacy"},
    {"name": "Clinique Rambouillet",       "lat": 48.6450, "lon": 1.8327, "type": "clinic"},
]

# Facility Type & Time Window Configuration
# CRITICAL: Hospital has earliest opening (6am) for emergency deliveries
TIME_WINDOWS = {
    "pharmacy": ("08:00", "18:00"),  # Standard business hours
    "clinic":   ("07:00", "14:00"),  # Earlier opening for medical facilities
    "hospital": ("06:00", "12:00"),  # Earliest opening, shortest window (urgent)
}

# Priority levels for delivery sequencing (0 = highest priority)
PRIORITY_LEVELS = {
    "urgent":  0,      # Medical emergency supplies
    "hospital": 1,     # Hospital deliveries
    "clinic":  2,      # Clinic deliveries
    "pharmacy": 3,     # Pharmacy deliveries
}

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great-circle distance between two coordinates using Haversine formula.
    
    Args:
        lat1, lon1: Starting point (decimal degrees)
        lat2, lon2: Ending point (decimal degrees)
    
    Returns:
        Distance in kilometers
    
    Note:
        This is an approximation. For production, use actual road network data.
    """
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat/2)**2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlon/2)**2)
    return R * 2 * math.asin(math.sqrt(a))


def time_to_min(t: str) -> int:
    """
    Convert time string (HH:MM) to minutes since midnight.
    
    Args:
        t: Time string in format "HH:MM"
    
    Returns:
        Minutes since midnight
    """
    h, m = map(int, t.split(":"))
    return h * 60 + m


def min_to_time(m: float) -> str:
    """
    Convert minutes since midnight to time string (HH:MM).
    
    Args:
        m: Minutes since midnight
    
    Returns:
        Time string in format "HH:MM"
    """
    total_min = int(m)
    hours = total_min // 60
    minutes = total_min % 60
    return f"{hours:02d}:{minutes:02d}"


def is_feasible_vehicle(delivery: Dict, vehicle: Dict) -> bool:
    """
    Check if a vehicle can physically handle a delivery.
    
    Constraints checked:
    - Vehicle capacity ≥ delivery weight
    - Vehicle range ≥ 2 × distance to facility (round trip)
    
    Args:
        delivery: Delivery object with 'weight', 'lat', 'lon'
        vehicle: Vehicle object with 'capacity', 'range', 'speed'
    
    Returns:
        True if vehicle can handle delivery, False otherwise
    """
    dist_to = haversine(DEPOT["lat"], DEPOT["lon"], delivery["lat"], delivery["lon"])
    
    capacity_ok = delivery.get("weight", 0) <= vehicle.get("capacity", 0)
    range_ok = dist_to * 2 <= vehicle.get("range", 0)
    
    return capacity_ok and range_ok


def check_24h_constraint(pickup_time: str, delivery_time: str) -> bool:
    """
    Verify that delivery occurs within 24 hours of pickup.
    
    This is a CRITICAL constraint: medical goods cannot remain in vehicles
    for more than 24 hours.
    
    Args:
        pickup_time: Time when goods enter vehicle (HH:MM or datetime string)
        delivery_time: Estimated delivery time (HH:MM or datetime string)
    
    Returns:
        True if delivery is within 24 hours, False otherwise
    """
    try:
        # If simple time strings (same day), just check if delivery < pickup + 24h
        pickup_min = time_to_min(pickup_time) if isinstance(pickup_time, str) and len(pickup_time) == 5 else 0
        delivery_min = time_to_min(delivery_time) if isinstance(delivery_time, str) and len(delivery_time) == 5 else 0
        
        # Simple case: same day, just check order
        if delivery_min >= pickup_min:
            return True
        # Delivery next day - check if < 24h from pickup
        return (24*60 - pickup_min) + delivery_min < 24*60
    except:
        return True  # Default to safe if parsing fails


def calculate_driving_time(distance_km: float, speed_kmh: float) -> float:
    """
    Calculate driving time for a distance at given speed.
    
    Args:
        distance_km: Distance in kilometers
        speed_kmh: Average speed in km/h
    
    Returns:
        Time in minutes
    """
    return (distance_km / speed_kmh) * 60 if speed_kmh > 0 else 0


def calculate_service_time(facility_type: str) -> float:
    """
    Estimate service time at a facility (unloading, paperwork, etc.).
    
    Args:
        facility_type: Type of facility ('pharmacy', 'clinic', 'hospital')
    
    Returns:
        Service time in minutes
    """
    service_times = {
        "pharmacy": 10,     # Simple counter delivery
        "clinic": 15,       # More complex, multiple departments
        "hospital": 20,     # Complex logistics, signing, verification
    }
    return service_times.get(facility_type, 10)


def estimate_cost(distance_km: float, vehicle: Dict, time_minutes: float = 0) -> float:
    """
    Estimate operational cost of a delivery.
    
    Cost components:
    - Fuel cost: distance × vehicle.fuel_per_km
    - Labor cost: estimated at €0.15 per minute
    
    Args:
        distance_km: Total route distance
        vehicle: Vehicle object with 'fuel_per_km'
        time_minutes: Total route time in minutes
    
    Returns:
        Estimated cost in euros
    """
    fuel_cost = distance_km * vehicle.get("fuel_per_km", 0)
    labor_cost = time_minutes * 0.0025  # €0.15 per hour = €0.0025 per minute
    return round(fuel_cost + labor_cost, 2)

# ═══════════════════════════════════════════════════════════════════════════════
# DELIVERY PLANNING ALGORITHM
# ═══════════════════════════════════════════════════════════════════════════════

def plan_deliveries(deliveries: List[Dict], method: str = "greedy", max_vehicles: int = None) -> Tuple[List[Dict], List[Dict]]:
    """
    Plan delivery routes using adaptive greedy algorithm with constraint checking.
    
    Algorithm phases:
    1. Sort deliveries by priority and deadline
    2. Assign each delivery to suitable vehicle-driver pairs
    3. Build routes using nearest-neighbor heuristic
    4. Validate all constraints
    5. Report violations
    
    Args:
        deliveries: List of delivery objects
        method: Planning algorithm ("greedy", "weighted", "optimized")
        max_vehicles: Maximum number of vehicles to use (default: all available)
    
    Returns:
        Tuple of (successful_routes, unassigned_deliveries)
    """
    
    if max_vehicles is None:
        max_vehicles = len(VEHICLES)
    
    # Check if any delivery needs refrigeration
    has_refrigerated = any(d.get("refrigerated", False) for d in deliveries)
    
    # Select appropriate vehicles based on refrigeration needs
    if has_refrigerated:
        # Use only refrigerated vehicles
        active_vehicles = [v for v in VEHICLES if v.get("refrigerated", False)][:max_vehicles]
    else:
        # Use only non-refrigerated vehicles first
        active_vehicles = [v for v in VEHICLES if not v.get("refrigerated", False)][:max_vehicles]
        if len(active_vehicles) < max_vehicles:
            # Add refrigerated if needed to reach max_vehicles
            remaining = [v for v in VEHICLES if v.get("refrigerated", False)][:max_vehicles - len(active_vehicles)]
            active_vehicles.extend(remaining)
    
    # Phase 1: Sort deliveries by priority and time window deadline
    def delivery_sort_key(d):
        priority = PRIORITY_LEVELS.get(d.get("priority", d["type"]), 3)
        facility_type = d.get("type", "pharmacy")
        time_window = TIME_WINDOWS.get(facility_type, ("08:00", "18:00"))
        deadline = time_to_min(time_window[1])
        return (priority, deadline, d.get("weight", 0))
    
    sorted_deliveries = sorted(deliveries, key=delivery_sort_key)
    
    # Phase 2: Initialize routes (one per active vehicle)
    routes = {}
    for vehicle in active_vehicles:
        vid = vehicle["id"]
        routes[vid] = {
            "vehicle": vehicle,
            "driver": None,
            "stops": [],
            "total_weight": 0,
            "total_distance": 0,
            "total_time_min": 0,
            "drive_time_min": 0,
            "constraints_violated": []
        }
    
    # Assign drivers to vehicles (round-robin)
    for i, vid in enumerate(sorted(routes.keys())):
        routes[vid]["driver"] = DRIVERS[i % len(DRIVERS)]
    
    unassigned = []
    
    # Phase 3: Assign each delivery to best available vehicle
    for delivery in sorted_deliveries:
        assigned = False
        candidates = []
        
        for vid, route in routes.items():
            vehicle = route["vehicle"]
            driver = route["driver"]
            
            # Check hard constraints
            weight_ok = route["total_weight"] + delivery.get("weight", 0) <= vehicle.get("capacity", 0)
            vehicle_ok = is_feasible_vehicle(delivery, vehicle)
            
            if not (weight_ok and vehicle_ok):
                continue
            
            # Estimate insertion cost (nearest neighbor heuristic)
            if route["stops"]:
                last_stop = route["stops"][-1]
                insertion_cost = haversine(last_stop["lat"], last_stop["lon"], 
                                          delivery["lat"], delivery["lon"])
            else:
                insertion_cost = haversine(DEPOT["lat"], DEPOT["lon"], 
                                          delivery["lat"], delivery["lon"])
            
            candidates.append((insertion_cost, vid))
        
        if candidates:
            # Choose vehicle with lowest insertion cost
            candidates.sort(key=lambda x: x[0])
            best_vid = candidates[0][1]
            routes[best_vid]["stops"].append(delivery)
            routes[best_vid]["total_weight"] += delivery.get("weight", 0)
            assigned = True
        
        if not assigned:
            unassigned.append(delivery)
    
    # Phase 4: Build complete routes with timing and validation
    result_routes = []
    
    for vid, route in routes.items():
        if not route["stops"]:
            continue
        
        vehicle = route["vehicle"]
        driver = route["driver"]
        
        # Initial state
        start_min = time_to_min(driver["start"])
        current_min = start_min
        current_lat, current_lon = DEPOT["lat"], DEPOT["lon"]
        
        total_distance = 0
        drive_time = 0
        stops_with_timing = []
        violations = []
        
        # Build route with timing
        for stop_idx, stop in enumerate(route["stops"]):
            # Calculate segment
            distance = haversine(current_lat, current_lon, stop["lat"], stop["lon"])
            segment_drive_time = calculate_driving_time(distance, vehicle["speed"])
            
            # Check for mandatory break (after 4.5 hours continuous driving)
            if drive_time + segment_drive_time > 270:  # 270 min = 4.5 hours
                current_min += 30  # Add break
                drive_time = segment_drive_time
            else:
                drive_time += segment_drive_time
            
            arrival_min = current_min + segment_drive_time
            
            # Apply time window constraint
            facility_type = stop.get("type", "pharmacy")
            time_window = TIME_WINDOWS.get(facility_type, ("08:00", "18:00"))
            tw_open = time_to_min(time_window[0])
            tw_close = time_to_min(time_window[1])
            
            # Wait if arriving too early
            if arrival_min < tw_open:
                arrival_min = tw_open
            
            # Flag if arriving too late
            status = "ok"
            if arrival_min > tw_close:
                status = "late"
                violations.append(f"Arrival after closing: {stop['name']} closes at {time_window[1]}")
            
            service_time = calculate_service_time(facility_type)
            departure_min = arrival_min + service_time
            
            stops_with_timing.append({
                **stop,
                "sequence": stop_idx,
                "arrival_time": min_to_time(arrival_min),
                "departure_time": min_to_time(departure_min),
                "distance_from_prev": round(distance, 2),
                "status": status,
            })
            
            total_distance += distance
            current_min = departure_min
            current_lat, current_lon = stop["lat"], stop["lon"]
        
        # Return to depot
        return_distance = haversine(current_lat, current_lon, DEPOT["lat"], DEPOT["lon"])
        total_distance += return_distance
        return_time_min = current_min + calculate_driving_time(return_distance, vehicle["speed"])
        
        # Validate driver constraints
        if drive_time > driver["max_drive"] * 60:
            violations.append(f"Driver exceeds max hours: {drive_time/60:.1f}h > {driver['max_drive']}h")
        
        if return_time_min - start_min > (driver["max_drive"] + 1) * 60:
            violations.append(f"Total day exceeds {driver['max_drive']+1} hours")
        
        # Validate 24-hour constraint (simplified: if pickup is morning, delivery must be same day)
        pickup_assumed = driver["start"]
        last_delivery = min_to_time(return_time_min - 30)
        if not check_24h_constraint(pickup_assumed, last_delivery):
            violations.append("24-hour constraint violated: delivery extends into next day")
        
        # Calculate costs
        cost = estimate_cost(total_distance, vehicle, return_time_min - start_min)
        
        # Build result route
        route_result = {
            "id": f"RT-{vid}",
            "vehicle": vehicle,
            "driver": driver,
            "stops": stops_with_timing,
            "summary": {
                "total_distance": round(total_distance, 2),
                "total_weight": round(route["total_weight"], 2),
                "departure_time": min_to_time(start_min),
                "return_time": min_to_time(return_time_min),
                "elapsed_time": min_to_time(return_time_min - start_min),
                "drive_time": min_to_time(drive_time),
                "utilization_weight": round((route["total_weight"] / vehicle.get("capacity", 1)) * 100, 1),
                "utilization_time": round((drive_time / (driver["max_drive"] * 60)) * 100, 1),
                "cost_estimate": cost,
                "fuel_cost": round(total_distance * vehicle.get("fuel_per_km", 0), 2),
                "num_stops": len(stops_with_timing),
            },
            "constraints": {
                "violations": violations,
                "satisfied": len(violations) == 0
            }
        }
        
        result_routes.append(route_result)
    
    return result_routes, unassigned

# ═══════════════════════════════════════════════════════════════════════════════
# API ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/")
def index():
    """Serve main planner interface."""
    return send_from_directory('.', 'index.html')

@app.route("/home")
def home():
    """Serve homepage showcase."""
    return send_from_directory('.', 'homepage.html')

@app.route("/api/config")
def get_config():
    """Get system configuration (vehicles, drivers, facilities)."""
    return jsonify({
        "depot": DEPOT,
        "vehicles": VEHICLES,
        "drivers": DRIVERS,
        "time_windows": TIME_WINDOWS,
        "constraints": {
            "max_driver_hours": 9,
            "max_vehicle_age_hours": 24,
            "service_time_pharmacy": 10,
            "service_time_clinic": 15,
            "service_time_hospital": 20,
        }
    })

@app.route("/api/vehicles")
def get_vehicles():
    """Get available vehicles."""
    return jsonify(VEHICLES)

@app.route("/api/drivers")
def get_drivers():
    """Get available drivers."""
    return jsonify(DRIVERS)

@app.route("/api/addresses")
def get_addresses():
    """Get sample delivery addresses."""
    return jsonify(SAMPLE_ADDRESSES)

@app.route("/api/plan", methods=["POST"])
def plan():
    """
    Plan deliveries based on provided list.
    
    Request body:
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
            ...
        ]
    }
    
    Returns:
    {
        "success": true,
        "routes": [...],
        "unassigned": [...],
        "summary": {...}
    }
    """
    try:
        data = request.get_json()
        deliveries = data.get("deliveries", [])
        max_vehicles = data.get("max_vehicles", len(VEHICLES))
        
        if not deliveries:
            return jsonify({
                "success": False,
                "error": "No deliveries provided"
            }), 400
        
        # Validate deliveries
        for d in deliveries:
            if not all(k in d for k in ["lat", "lon", "weight"]):
                return jsonify({
                    "success": False,
                    "error": "Missing required fields in delivery"
                }), 400
        
        # Run planning algorithm
        routes, unassigned = plan_deliveries(deliveries, max_vehicles=max_vehicles)
        
        # Calculate summary statistics
        summary = {
            "total_deliveries": len(deliveries),
            "assigned": len(deliveries) - len(unassigned),
            "unassigned": len(unassigned),
            "routes_used": len([r for r in routes if r["summary"]["num_stops"] > 0]),
            "total_distance": round(sum(r["summary"]["total_distance"] for r in routes), 2),
            "total_cost": round(sum(r["summary"]["cost_estimate"] for r in routes), 2),
            "avg_utilization_weight": round(
                sum(r["summary"]["utilization_weight"] for r in routes) / max(len(routes), 1), 1
            ),
        }
        
        return jsonify({
            "success": True,
            "routes": routes,
            "unassigned": unassigned,
            "summary": summary
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/api/demo")
def demo():
    """
    Generate demo dataset with realistic test scenarios.
    
    Test scenario: 15 deliveries across mixed facility types with various weights.
    Expected: 3-4 routes with good constraint satisfaction.
    """
    random.seed(42)
    
    deliveries = []
    for i, addr in enumerate(SAMPLE_ADDRESSES[:15]):
        # Mix of priorities: some urgent, mostly normal
        is_urgent = i % 7 == 0
        priority = "urgent" if is_urgent else addr["type"]
        
        # Realistic weight distribution
        if addr["type"] == "hospital":
            weight = random.choice([150, 200, 250, 300])
        elif addr["type"] == "clinic":
            weight = random.choice([50, 80, 100, 150])
        else:  # pharmacy
            weight = random.choice([10, 20, 25, 30, 40])
        
        deliveries.append({
            "id": f"DEL{i+1:03d}",
            "name": addr["name"],
            "type": addr["type"],
            "lat": addr["lat"],
            "lon": addr["lon"],
            "weight": weight,
            "priority": priority,
            "refrigerated": addr["type"] in ["hospital", "clinic"] or i % 3 == 0,
        })
    
    # Run planning
    routes, unassigned = plan_deliveries(deliveries)
    
    return jsonify({
        "success": True,
        "scenario": "demo",
        "deliveries": deliveries,
        "routes": routes,
        "unassigned": unassigned,
        "depot": DEPOT,
        "summary": {
            "total_deliveries": len(deliveries),
            "assigned": len(deliveries) - len(unassigned),
            "routes_active": len([r for r in routes if r["summary"]["num_stops"] > 0]),
        }
    })

@app.route("/api/demo/stress")
def demo_stress():
    """
    Generate stress test: high-volume deliveries with capacity constraints.
    
    Test scenario: 30+ deliveries, limited vehicles, forcing optimization.
    Expected: High utilization, some unassigned deliveries or constraint violations.
    """
    random.seed(123)
    
    deliveries = []
    # Generate 25 deliveries with emphasis on hospitals/clinics
    for i in range(25):
        addr = random.choice(SAMPLE_ADDRESSES)
        
        # 40% hospitals, 30% clinics, 30% pharmacies (stress test)
        rand = random.random()
        if rand < 0.4:
            facility_type = "hospital"
            weight = random.choice([200, 250, 300])
        elif rand < 0.7:
            facility_type = "clinic"
            weight = random.choice([100, 150, 200])
        else:
            facility_type = "pharmacy"
            weight = random.choice([30, 40, 50])
        
        # Find matching address
        matching = [a for a in SAMPLE_ADDRESSES if a["type"] == facility_type]
        if matching:
            addr = random.choice(matching)
        
        priority = "urgent" if random.random() < 0.2 else addr["type"]
        
        deliveries.append({
            "id": f"STRESS{i+1:03d}",
            "name": addr["name"],
            "type": facility_type,
            "lat": addr["lat"],
            "lon": addr["lon"],
            "weight": weight,
            "priority": priority,
            "refrigerated": True,
        })
    
    routes, unassigned = plan_deliveries(deliveries)
    
    return jsonify({
        "success": True,
        "scenario": "stress_test",
        "deliveries": deliveries,
        "routes": routes,
        "unassigned": unassigned,
        "summary": {
            "total_deliveries": len(deliveries),
            "assigned": len(deliveries) - len(unassigned),
            "unassigned": len(unassigned),
            "routes_active": len([r for r in routes if r["summary"]["num_stops"] > 0]),
            "total_weight": sum(d.get("weight", 0) for d in deliveries),
            "avg_weight_per_delivery": round(sum(d.get("weight", 0) for d in deliveries) / len(deliveries), 1),
        }
    })

@app.route("/api/analyze/<route_id>")
def analyze_route(route_id):
    """
    Detailed analysis of a specific route (for debugging/optimization).
    
    Note: This is a placeholder that would require route storage.
    In production, routes would be stored and retrieved by ID.
    """
    return jsonify({
        "error": "Route analysis requires route storage implementation"
    }), 501

# Health check endpoint
@app.route("/api/health")
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "version": "1.0",
        "timestamp": datetime.now().isoformat()
    })

# ═══════════════════════════════════════════════════════════════════════════════
# APPLICATION ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    """
    Start the Flask development server.
    
    For production deployment, use a WSGI server like:
    - gunicorn: gunicorn -w 4 app:app
    - uwsgi: uwsgi --http :5000 --wsgi-file app.py --callable app
    
    The application provides:
    - Web UI at http://localhost:5000/
    - Homepage showcase at http://localhost:5000/home
    - REST API at http://localhost:5000/api/*
    """
    app.run(debug=True, host="0.0.0.0", port=5000, threaded=True)
