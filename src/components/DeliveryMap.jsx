import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DEPOT } from '../utils'

const ROUTE_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4']
const TYPE_COLOR = { pharmacy: '#22c55e', clinic: '#f59e0b', hospital: '#3b82f6', urgent: '#ef4444' }

export default function DeliveryMap({ deliveries, routes }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])
  const polylinesRef = useRef([])

  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([48.82, 2.38], 11)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19,
      }).addTo(map.current)
    }

    // Clear existing markers and polylines
    markersRef.current.forEach((m) => map.current.removeLayer(m))
    polylinesRef.current.forEach((p) => map.current.removeLayer(p))
    markersRef.current = []
    polylinesRef.current = []

    // Add depot
    const depotIcon = L.divIcon({
      html: `<div style="width:16px;height:16px;background:#fff;border:3px solid #1f2937;border-radius:50%;box-shadow:0 0 0 2px #fff;display:flex;align-items:center;justify-content:center;"><span style="font-size:8px;color:#1f2937;font-weight:bold;">D</span></div>`,
      iconAnchor: [8, 8],
      className: '',
    })

    const depotMarker = L.marker([DEPOT.lat, DEPOT.lon], { icon: depotIcon }).addTo(map.current)
    depotMarker.bindPopup(`<b>${DEPOT.name}</b>`)
    markersRef.current.push(depotMarker)

    if (routes.length > 0) {
      // Draw routes
      routes.forEach((route, routeIdx) => {
        const color = ROUTE_COLORS[routeIdx % ROUTE_COLORS.length]
        const points = [[DEPOT.lat, DEPOT.lon]]

        route.stops.forEach((stop) => {
          points.push([stop.lat, stop.lon])
        })

        points.push([DEPOT.lat, DEPOT.lon])

        // Draw polyline
        const polyline = L.polyline(points, {
          color,
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map.current)
        polylinesRef.current.push(polyline)

        // Add markers for stops with order numbers
        route.stops.forEach((stop, stopIdx) => {
          const icon = L.divIcon({
            html: `<div style="width:36px;height:36px;background:${stop.priority === 'urgent' ? TYPE_COLOR.urgent : TYPE_COLOR[stop.type]};border:4px solid ${color};border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;"><span style="color:#fff;font-weight:bold;font-size:14px;text-shadow:0 0 2px #000;">${stopIdx + 1}</span></div>`,
            iconAnchor: [18, 18],
            className: '',
          })

          const marker = L.marker([stop.lat, stop.lon], { icon })
            .addTo(map.current)
            .bindPopup(
              `<div style="font-family:monospace;font-size:11px;color:#333;">
                <b>${stop.name}</b><br/>
                Arrivée: ${stop.arrival}<br/>
                Poids: ${stop.weight} kg<br/>
                Distance: ${stop.distance_from_prev} km
              </div>`
            )
          markersRef.current.push(marker)
        })
      })

      // Fit bounds to show all routes
      if (routes.length > 0 && routes[0].stops.length > 0) {
        const bounds = L.latLngBounds([[DEPOT.lat, DEPOT.lon]])
        routes.forEach((route) => {
          route.stops.forEach((stop) => {
            bounds.extend([stop.lat, stop.lon])
          })
        })
        map.current.fitBounds(bounds, { padding: [50, 50] })
      }
    } else if (deliveries.length > 0) {
      // Show only deliveries
      deliveries.forEach((delivery) => {
        const color = delivery.priority === 'urgent' ? TYPE_COLOR.urgent : TYPE_COLOR[delivery.type]
        const icon = L.divIcon({
          html: `<div style="width:10px;height:10px;background:${color};border-radius:50%;opacity:0.8;"></div>`,
          iconAnchor: [5, 5],
          className: '',
        })

        const marker = L.marker([delivery.lat, delivery.lon], { icon })
          .addTo(map.current)
          .bindPopup(`<b>${delivery.name}</b>`)
        markersRef.current.push(marker)
      })

      // Fit bounds
      if (deliveries.length > 0) {
        const bounds = L.latLngBounds([[DEPOT.lat, DEPOT.lon]])
        deliveries.forEach((d) => bounds.extend([d.lat, d.lon]))
        map.current.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [deliveries, routes])

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Legend - fixed positioning */}
      <div className="absolute bottom-4 left-4 bg-gray-900/95 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 shadow-2xl backdrop-blur-md z-[1000] max-w-[180px]">
        <p className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Legend</p>
        <div className="space-y-2.5">
          {[
            { label: 'Pharmacy', color: '#22c55e', icon: '●' },
            { label: 'Clinic', color: '#f59e0b', icon: '●' },
            { label: 'Hospital', color: '#3b82f6', icon: '●' },
            { label: 'Urgent', color: '#ef4444', icon: '●' },
            { label: 'Depot', color: '#fff', icon: '◯' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span
                style={{ color: item.color }}
                className="text-sm leading-none"
              >
                {item.icon}
              </span>
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Route colors */}
        {routes.length > 0 && (
          <>
            <div className="border-t border-gray-700 my-3" />
            <p className="font-bold text-white mb-2 text-xs uppercase tracking-wider">Routes</p>
            <div className="space-y-2">
              {routes.map((route, i) => {
                const color = ROUTE_COLORS[i % ROUTE_COLORS.length]
                return (
                  <div key={route.vehicle.id} className="flex items-center gap-2.5">
                    <div
                      style={{ backgroundColor: color }}
                      className="w-6 h-1 rounded-full"
                    />
                    <span className="text-xs text-gray-400 truncate">
                      {route.vehicle.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}