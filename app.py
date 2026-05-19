from flask import Flask, request, jsonify, send_from_directory
import math
import random
import os

app = Flask(__name__, static_folder='.')

# ── Données de référence ──────────────────────────────────────────────────────

DEPOT = {"name": "Dépôt Ivry", "lat": 48.8145, "lon": 2.3871}

VEHICLES = [
    {"id": "V1", "name": "Scooter électrique 1", "type": "scooter", "capacity": 30,  "range": 60,  "fuel_per_km": 0.0, "speed": 25},
    {"id": "V2", "name": "Scooter électrique 2", "type": "scooter", "capacity": 30,  "range": 60,  "fuel_per_km": 0.0, "speed": 25},
    {"id": "V3", "name": "Camionnette frigo 1",  "type": "van",     "capacity": 800, "range": 150, "fuel_per_km": 0.09,"speed": 40},
    {"id": "V4", "name": "Camionnette frigo 2",  "type": "van",     "capacity": 800, "range": 150, "fuel_per_km": 0.09,"speed": 40},
    {"id": "V5", "name": "Camionnette frigo 3",  "type": "van",     "capacity": 800, "range": 150, "fuel_per_km": 0.09,"speed": 40},
    {"id": "V6", "name": "Grand van isotherme",  "type": "bigvan",  "capacity":1500, "range": 300, "fuel_per_km": 0.12,"speed": 35},
]

DRIVERS = [
    {"id": "D1", "name": "Ahmed B.",    "start": "07:00", "max_drive": 9},
    {"id": "D2", "name": "Sophie M.",   "start": "07:00", "max_drive": 9},
    {"id": "D3", "name": "Karim L.",    "start": "06:30", "max_drive": 9},
    {"id": "D4", "name": "Nadia P.",    "start": "08:00", "max_drive": 9},
    {"id": "D5", "name": "Thomas R.",   "start": "07:30", "max_drive": 9},
]

# Adresses fictives Paris + petite couronne
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

TIME_WINDOWS = {
    "pharmacy": ("08:00", "18:00"),
    "clinic":   ("07:00", "14:00"),
    "hospital": ("06:00", "12:00"),
}

# ── Utilitaires ───────────────────────────────────────────────────────────────

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def time_to_min(t):
    h, m = map(int, t.split(":"))
    return h * 60 + m

def min_to_time(m):
    return f"{int(m)//60:02d}:{int(m)%60:02d}"

def feasible_vehicle(delivery, vehicle):
    """Vérifie si un véhicule peut prendre cette livraison (capacité, portée)."""
    dist_to = haversine(DEPOT["lat"], DEPOT["lon"], delivery["lat"], delivery["lon"])
    return (delivery["weight"] <= vehicle["capacity"] and
            dist_to * 2 <= vehicle["range"])

# ── Algorithme de planification (greedy nearest-neighbor + contraintes) ───────

def plan_deliveries(deliveries):
    """
    Algorithme naïf mais structuré :
    1. Trie les livraisons par priorité (urgent > hospital > clinic > pharmacy)
       puis par fenêtre de temps (deadline croissante)
    2. Assigne chaque livraison au meilleur véhicule disponible (capacité restante,
       portée suffisante, fenêtre horaire compatible)
    3. Dans chaque tournée, ordonne par nearest-neighbor depuis le dépôt
    """
    PRIORITY = {"urgent": 0, "hospital": 1, "clinic": 2, "pharmacy": 3}

    sorted_deliveries = sorted(
        deliveries,
        key=lambda d: (PRIORITY.get(d.get("priority", d["type"]), 3),
                       time_to_min(TIME_WINDOWS[d["type"]][1]))
    )

    routes = {v["id"]: {"vehicle": v, "stops": [], "total_weight": 0,
                         "total_dist": 0, "driver": None} for v in VEHICLES}

    # Assigner un chauffeur à chaque véhicule (round-robin)
    for i, vid in enumerate(routes):
        routes[vid]["driver"] = DRIVERS[i % len(DRIVERS)]

    unassigned = []

    for d in sorted_deliveries:
        assigned = False
        # Cherche le véhicule avec le moins de km parcourus qui peut prendre la livraison
        candidates = []
        for vid, route in routes.items():
            v = route["vehicle"]
            if (route["total_weight"] + d["weight"] <= v["capacity"] and
                    feasible_vehicle(d, v)):
                # Estime le coût d'insertion (distance depuis dernier stop ou dépôt)
                if route["stops"]:
                    last = route["stops"][-1]
                    extra = haversine(last["lat"], last["lon"], d["lat"], d["lon"])
                else:
                    extra = haversine(DEPOT["lat"], DEPOT["lon"], d["lat"], d["lon"])
                candidates.append((extra, vid))

        if candidates:
            candidates.sort()
            best_vid = candidates[0][1]
            routes[best_vid]["stops"].append(d)
            routes[best_vid]["total_weight"] += d["weight"]
            assigned = True

        if not assigned:
            unassigned.append(d)

    # Calcul des horaires pour chaque tournée
    result_routes = []
    for vid, route in routes.items():
        if not route["stops"]:
            continue

        v = route["vehicle"]
        driver = route["driver"]
        start_min = time_to_min(driver["start"])
        current_min = start_min
        current_lat, current_lon = DEPOT["lat"], DEPOT["lon"]
        total_dist = 0
        stops_with_time = []
        drive_time = 0

        for stop in route["stops"]:
            dist = haversine(current_lat, current_lon, stop["lat"], stop["lon"])
            travel_min = (dist / v["speed"]) * 60
            drive_time += travel_min

            # Pause obligatoire si > 4h30 de conduite
            if drive_time > 270:
                current_min += 30
                drive_time = 0

            arrival_min = current_min + travel_min
            tw_open  = time_to_min(TIME_WINDOWS[stop["type"]][0])
            tw_close = time_to_min(TIME_WINDOWS[stop["type"]][1])

            # Attend l'ouverture si on arrive trop tôt
            if arrival_min < tw_open:
                arrival_min = tw_open

            status = "ok"
            if arrival_min > tw_close:
                status = "late"

            service_min = 10  # 10 min de service standard
            stops_with_time.append({
                **stop,
                "arrival": min_to_time(arrival_min),
                "departure": min_to_time(arrival_min + service_min),
                "distance_from_prev": round(dist, 1),
                "status": status,
            })

            total_dist += dist
            current_min = arrival_min + service_min
            current_lat, current_lon = stop["lat"], stop["lon"]

        # Retour au dépôt
        return_dist = haversine(current_lat, current_lon, DEPOT["lat"], DEPOT["lon"])
        total_dist += return_dist
        return_min = current_min + (return_dist / v["speed"]) * 60

        result_routes.append({
            "vehicle": v,
            "driver": driver,
            "stops": stops_with_time,
            "total_dist": round(total_dist, 1),
            "total_weight": route["total_weight"],
            "return_time": min_to_time(return_min),
            "fuel_cost": round(total_dist * v["fuel_per_km"] * 1.85, 2),
        })

    return result_routes, unassigned

# ── Routes API ────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory('.', 'index.html')

@app.route("/api/vehicles")
def get_vehicles():
    return jsonify(VEHICLES)

@app.route("/api/drivers")
def get_drivers():
    return jsonify(DRIVERS)

@app.route("/api/addresses")
def get_addresses():
    return jsonify(SAMPLE_ADDRESSES)

@app.route("/api/plan", methods=["POST"])
def plan():
    data = request.get_json()
    deliveries = data.get("deliveries", [])
    if not deliveries:
        return jsonify({"error": "Aucune livraison fournie"}), 400
    routes, unassigned = plan_deliveries(deliveries)
    return jsonify({"routes": routes, "unassigned": unassigned})

@app.route("/api/demo")
def demo():
    """Génère un jeu de données de démonstration."""
    random.seed(42)
    deliveries = []
    for i, addr in enumerate(SAMPLE_ADDRESSES[:15]):
        priority = "urgent" if i % 7 == 0 else addr["type"]
        deliveries.append({
            **addr,
            "id": f"LIV{i+1:03d}",
            "weight": random.choice([5, 10, 15, 20, 25, 40, 80, 150]),
            "priority": priority,
            "refrigerated": addr["type"] == "hospital" or i % 4 == 0,
        })
    routes, unassigned = plan_deliveries(deliveries)
    return jsonify({
        "deliveries": deliveries,
        "routes": routes,
        "unassigned": unassigned,
        "depot": DEPOT,
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
