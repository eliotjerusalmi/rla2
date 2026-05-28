// Constants
export const VEHICLE_TYPES = {
  big_normal: {
    type: 'big_normal',
    name: 'Big Van (Normal)',
    capacity: 200,
    range: 200,
    fuel_per_km: 0.10,
    speed: 35,
    refrigerated: false,
    size: 'big',
    icon: '🚛',
  },
  big_fridge: {
    type: 'big_fridge',
    name: 'Big Van (Fridge)',
    capacity: 200,
    range: 200,
    fuel_per_km: 0.13,
    speed: 35,
    refrigerated: true,
    size: 'big',
    icon: '🚛',
  },
  small_normal: {
    type: 'small_normal',
    name: 'Small Van (Normal)',
    capacity: 100,
    range: 150,
    fuel_per_km: 0.06,
    speed: 50,
    refrigerated: false,
    size: 'small',
    icon: '🚐',
  },
  small_fridge: {
    type: 'small_fridge',
    name: 'Small Van (Fridge)',
    capacity: 100,
    range: 150,
    fuel_per_km: 0.08,
    speed: 50,
    refrigerated: true,
    size: 'small',
    icon: '🚐',
  },
}

export const DEFAULT_FLEET = {
  big_normal: 2,
  big_fridge: 1,
  small_normal: 2,
  small_fridge: 1,
}

export const ADDRESSES = [
  { name: 'Pharmacie du Châtelet', lat: 48.8604, lon: 2.3477, type: 'pharmacy' },
  { name: 'Clinique Saint-Antoine', lat: 48.8491, lon: 2.3874, type: 'clinic' },
  { name: 'Pharmacie Nation', lat: 48.8486, lon: 2.3965, type: 'pharmacy' },
  { name: 'Hôpital Lariboisière', lat: 48.8797, lon: 2.3568, type: 'hospital' },
  { name: 'Pharmacie Montparnasse', lat: 48.8424, lon: 2.3218, type: 'pharmacy' },
  { name: 'Clinique du Trocadéro', lat: 48.8637, lon: 2.2905, type: 'clinic' },
  { name: 'Pharmacie Opéra', lat: 48.8706, lon: 2.3318, type: 'pharmacy' },
  { name: 'Hôpital Bicêtre', lat: 48.7895, lon: 2.3538, type: 'hospital' },
  { name: 'Pharmacie Vincennes', lat: 48.8480, lon: 2.4390, type: 'pharmacy' },
  { name: 'Clinique des Lilas', lat: 48.8793, lon: 2.4193, type: 'clinic' },
  { name: 'Pharmacie Boulogne', lat: 48.8355, lon: 2.2400, type: 'pharmacy' },
  { name: 'Pharmacie Pantin', lat: 48.8987, lon: 2.4044, type: 'pharmacy' },
  { name: 'Hôpital Avicenne Bobigny', lat: 48.9050, lon: 2.4412, type: 'hospital' },
  { name: 'Pharmacie Montreuil', lat: 48.8646, lon: 2.4481, type: 'pharmacy' },
  { name: 'Clinique Massy', lat: 48.7259, lon: 2.2735, type: 'clinic' },
  { name: 'Pharmacie Versailles', lat: 48.8044, lon: 2.1314, type: 'pharmacy' },
  { name: 'Pharmacie Créteil', lat: 48.7771, lon: 2.4558, type: 'pharmacy' },
  { name: 'Hôpital Henri Mondor', lat: 48.7869, lon: 2.4652, type: 'hospital' },
  { name: 'Pharmacie Saint-Denis', lat: 48.9359, lon: 2.3618, type: 'pharmacy' },
  { name: 'Clinique Rambouillet', lat: 48.6450, lon: 1.8327, type: 'clinic' },
]

export const TIME_WINDOWS = {
  pharmacy: ['08:00', '18:00'],
  clinic: ['07:00', '14:00'],
  hospital: ['06:00', '12:00'],
}

export const DEPOT = { lat: 48.8145, lon: 2.3871, name: 'Dépôt Ivry-sur-Seine' }

export const MAX_TOTAL_WEIGHT = 2000

export function timeToMin(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minToTime(min) {
  const h = Math.floor(min / 60)
  const m = Math.floor(min % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export function calculateDrivingTime(distanceKm, speedKmh) {
  return speedKmh > 0 ? (distanceKm / speedKmh) * 60 : 0
}

export function calculateServiceTime(facilityType) {
  const serviceTimes = { pharmacy: 10, clinic: 15, hospital: 20 }
  return serviceTimes[facilityType] || 10
}

export function estimateCost(distanceKm, vehicle, timeMinutes = 0) {
  const fuelCost = distanceKm * (vehicle?.fuel_per_km || 0.1)
  const laborCost = timeMinutes * 0.0025
  return Math.round((fuelCost + laborCost) * 100) / 100
}

function routeDistance(stops, depot) {
  if (!stops || stops.length === 0) return 0
  let dist = haversine(depot.lat, depot.lon, stops[0].lat, stops[0].lon)
  for (let i = 0; i < stops.length - 1; i++) {
    dist += haversine(stops[i].lat, stops[i].lon, stops[i + 1].lat, stops[i + 1].lon)
  }
  dist += haversine(stops[stops.length - 1].lat, stops[stops.length - 1].lon, depot.lat, depot.lon)
  return dist
}

function twoOpt(stops, depot) {
  if (!stops || stops.length < 2) return stops || []
  let improved = true
  let best = [...stops]
  let bestDist = routeDistance(best, depot)

  while (improved) {
    improved = false
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const newRoute = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)]
        const newDist = routeDistance(newRoute, depot)
        if (newDist < bestDist - 0.001) {
          best = newRoute
          bestDist = newDist
          improved = true
        }
      }
    }
  }
  return best
}

function nearestNeighborRoute(stops, depot) {
  if (!stops || stops.length === 0) return []
  const unvisited = [...stops]
  const route = []
  let current = depot

  while (unvisited.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity
    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversine(current.lat, current.lon, unvisited[i].lat, unvisited[i].lon)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    }
    route.push(unvisited[nearestIdx])
    current = unvisited[nearestIdx]
    unvisited.splice(nearestIdx, 1)
  }

  return twoOpt(route, depot)
}

function sortUrgentByNearest(urgentDeliveries, depot) {
  if (!urgentDeliveries || urgentDeliveries.length <= 1) return urgentDeliveries || []
  const unvisited = [...urgentDeliveries]
  const sorted = []
  let current = depot

  while (unvisited.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity
    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversine(current.lat, current.lon, unvisited[i].lat, unvisited[i].lon)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    }
    sorted.push(unvisited[nearestIdx])
    current = unvisited[nearestIdx]
    unvisited.splice(nearestIdx, 1)
  }
  return sorted
}

function sortNonUrgent(deliveries, depot) {
  const PRIORITY = { hospital: 1, clinic: 2, pharmacy: 3 }

  return [...(deliveries || [])].sort((a, b) => {
    const prioA = PRIORITY[a?.type] ?? 3
    const prioB = PRIORITY[b?.type] ?? 3
    if (prioA !== prioB) return prioA - prioB

    const twA = TIME_WINDOWS[a?.type] || ['08:00', '18:00']
    const twB = TIME_WINDOWS[b?.type] || ['08:00', '18:00']
    const deadlineA = timeToMin(twA[1])
    const deadlineB = timeToMin(twB[1])
    if (deadlineA !== deadlineB) return deadlineA - deadlineB

    const distA = haversine(depot.lat, depot.lon, a?.lat || 0, a?.lon || 0)
    const distB = haversine(depot.lat, depot.lon, b?.lat || 0, b?.lon || 0)
    return distA - distB
  })
}

function buildFleet(fleetConfig) {
  const fleet = []
  let idCounter = 1

  const configs = [
    { key: 'big_normal', count: fleetConfig?.big_normal || 0 },
    { key: 'big_fridge', count: fleetConfig?.big_fridge || 0 },
    { key: 'small_normal', count: fleetConfig?.small_normal || 0 },
    { key: 'small_fridge', count: fleetConfig?.small_fridge || 0 },
  ]

  for (const cfg of configs) {
    const template = VEHICLE_TYPES[cfg.key]
    if (!template) continue
    for (let i = 0; i < cfg.count; i++) {
      fleet.push({
        id: `V${idCounter++}`,
        name: `${template.name} ${i + 1}`,
        type: template.type,
        capacity: template.capacity,
        range: template.range,
        fuel_per_km: template.fuel_per_km,
        speed: template.speed,
        refrigerated: template.refrigerated,
        size: template.size,
        icon: template.icon,
      })
    }
  }

  return fleet
}

// ============================================================
// MAIN PLANNING ALGORITHM
// Prioritize SMALL vehicles first (faster, less consuming)
// Only use BIG vehicles when small ones are full/unavailable
// ============================================================

export function planDeliveries(deliveries, fleetConfig = DEFAULT_FLEET) {
  try {
    // Deduplicate
    const uniqueMap = new Map()
    for (const d of (deliveries || [])) {
      if (!d) continue
      const key = `${d.lat},${d.lon}`
      if (uniqueMap.has(key)) {
        const existing = uniqueMap.get(key)
        existing.weight = (existing.weight || 0) + (d.weight || 0)
        if (d.priority === 'urgent') existing.priority = 'urgent'
        if (d.refrigerated) existing.refrigerated = true
        const twA = TIME_WINDOWS[d.type] || ['08:00', '18:00']
        const twB = TIME_WINDOWS[existing.type] || ['08:00', '18:00']
        if (timeToMin(twA[1]) < timeToMin(twB[1])) {
          existing.type = d.type
        }
      } else {
        uniqueMap.set(key, { ...d })
      }
    }
    const dedupedDeliveries = Array.from(uniqueMap.values())

    const totalWeight = dedupedDeliveries.reduce((s, d) => s + (d.weight || 0), 0)

    if (totalWeight > MAX_TOTAL_WEIGHT) {
      throw new Error(`Total weight ${totalWeight} kg exceeds the ${MAX_TOTAL_WEIGHT} kg maximum.`)
    }

    const fleet = buildFleet(fleetConfig)

    if (fleet.length === 0) {
      throw new Error('No vehicles selected. Please select at least one van.')
    }

    const hasRefrigerated = dedupedDeliveries.some(d => d.refrigerated === true)
    const fridgeVehicles = fleet.filter(v => v.refrigerated)

    if (hasRefrigerated && fridgeVehicles.length === 0) {
      throw new Error('Some deliveries require refrigeration. Please select at least one refrigerated van.')
    }

    const totalCapacity = fleet.reduce((s, v) => s + (v.capacity || 0), 0)
    if (totalWeight > totalCapacity) {
      throw new Error(`Total weight ${totalWeight} kg exceeds fleet capacity ${totalCapacity} kg.`)
    }

    // Sort deliveries
    const urgentDeliveries = dedupedDeliveries.filter(d => d.priority === 'urgent')
    const nonUrgentDeliveries = dedupedDeliveries.filter(d => d.priority !== 'urgent')
    const sortedUrgent = sortUrgentByNearest(urgentDeliveries, DEPOT)
    const sortedNonUrgent = sortNonUrgent(nonUrgentDeliveries, DEPOT)
    const sorted = [...sortedUrgent, ...sortedNonUrgent]

    // Assign to vehicles - PRIORITIZE SMALL FIRST
    const clusters = fleet.map(() => [])
    const clusterWeights = fleet.map(() => 0)
    const unassigned = []

    for (const delivery of sorted) {
      let remaining = delivery.weight || 0
      let assigned = false

      while (remaining > 0) {
        let bestVehicle = -1
        let bestScore = Infinity

        for (let i = 0; i < fleet.length; i++) {
          const vehicle = fleet[i]
          const spaceLeft = (vehicle.capacity || 0) - clusterWeights[i]
          if (spaceLeft <= 0) continue

          // Refrigeration constraint
          if (delivery.refrigerated && !vehicle.refrigerated) continue

          // Calculate distance score (geographic affinity)
          let distanceScore
          if (clusters[i].length === 0) {
            distanceScore = haversine(DEPOT.lat, DEPOT.lon, delivery.lat, delivery.lon)
          } else {
            const last = clusters[i][clusters[i].length - 1]
            distanceScore = haversine(last.lat, last.lon, delivery.lat, delivery.lon)
          }

          // ============================================================
          // KEY CHANGE: Strongly prefer small vehicles
          // Small = faster (50km/h), less fuel (0.06-0.08/km)
          // Big = slower (35km/h), more fuel (0.10-0.13/km)
          // ============================================================
          // Penalty multiplier: big vehicles get a much higher score (worse)
          // This makes small vehicles win unless they're full or much farther
          const sizePenalty = vehicle.size === 'big' ? 3.0 : 1.0

          // Also prefer vehicles that are already being used (tighter packing)
          const utilization = clusterWeights[i] / (vehicle.capacity || 1)
          const packingBonus = 1 - (utilization * 0.2)

          // Final score: lower is better
          const score = distanceScore * sizePenalty * packingBonus

          if (score < bestScore) {
            bestScore = score
            bestVehicle = i
          }
        }

        if (bestVehicle === -1) {
          if (!assigned) unassigned.push(delivery)
          break
        }

        const chunk = Math.min(remaining, (fleet[bestVehicle].capacity || 100) - clusterWeights[bestVehicle])
        remaining -= chunk
        clusterWeights[bestVehicle] += chunk

        const isSplit = (delivery.weight || 0) > (fleet[bestVehicle].capacity || 100)
        const stop = isSplit
          ? { ...delivery, weight: chunk, name: `${delivery.name} (${chunk} kg)`, _originalId: delivery.id }
          : { ...delivery }

        clusters[bestVehicle].push(stop)
        assigned = true
      }
    }

    // Build routes with timing
    const result = []

    for (let i = 0; i < fleet.length; i++) {
      const vehicle = fleet[i]
      let clusterStops = clusters[i]

      if (!clusterStops || clusterStops.length === 0) continue

      clusterStops = nearestNeighborRoute(clusterStops, DEPOT)

      let currentMin = timeToMin('07:00')
      let currentLat = DEPOT.lat
      let currentLon = DEPOT.lon
      let totalDistance = 0
      let driveTime = 0
      let violations = []

      const stops = []

      for (let stopIdx = 0; stopIdx < clusterStops.length; stopIdx++) {
        const stop = clusterStops[stopIdx]

        const distance = haversine(currentLat, currentLon, stop.lat, stop.lon)
        const segmentDriveTime = calculateDrivingTime(distance, vehicle.speed || 40)

        if (driveTime + segmentDriveTime > 270) {
          currentMin += 30
          driveTime = segmentDriveTime
        } else {
          driveTime += segmentDriveTime
        }

        let arrivalMin = currentMin + segmentDriveTime

        const facilityType = stop.type || 'pharmacy'
        const timeWindow = TIME_WINDOWS[facilityType] || ['08:00', '18:00']
        const twOpen = timeToMin(timeWindow[0])
        const twClose = timeToMin(timeWindow[1])

        if (arrivalMin < twOpen) arrivalMin = twOpen

        let status = 'ok'
        if (arrivalMin > twClose) {
          status = 'late'
          violations.push(`Arrival after closing: ${stop.name} closes at ${timeWindow[1]}`)
        }

        const serviceTime = calculateServiceTime(facilityType)
        const departureMin = arrivalMin + serviceTime

        totalDistance += distance
        currentMin = departureMin
        currentLat = stop.lat
        currentLon = stop.lon

        stops.push({
          ...stop,
          sequence: stopIdx,
          arrival: minToTime(arrivalMin),
          departure: minToTime(departureMin),
          distance_from_prev: Math.round(distance * 100) / 100,
          status,
        })
      }

      const returnDistance = haversine(currentLat, currentLon, DEPOT.lat, DEPOT.lon)
      totalDistance += returnDistance
      const returnTime = minToTime(currentMin + calculateDrivingTime(returnDistance, vehicle.speed || 40))

      result.push({
        vehicle,
        stops,
        total_distance: Math.round(totalDistance * 100) / 100,
        total_weight: clusterWeights[i],
        return_time: returnTime,
        cost: Math.round(estimateCost(totalDistance, vehicle, currentMin) * 100) / 100,
        violations,
      })
    }

    return { routes: result, unassigned, fleet }
  } catch (err) {
    console.error('planDeliveries error:', err)
    throw err
  }
}