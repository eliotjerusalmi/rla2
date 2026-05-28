import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ROUTE_COLORS = [
  'from-green-500 to-emerald-600',
  'from-blue-500 to-cyan-600',
  'from-purple-500 to-pink-600',
  'from-yellow-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-indigo-500 to-violet-600',
]

const TYPE_COLOR = {
  pharmacy: 'text-green-400',
  clinic: 'text-yellow-400',
  hospital: 'text-blue-400',
}

export default function RoutesList({ routes, unassigned }) {
  const [expandedRoute, setExpandedRoute] = useState(0)

  return (
    <div className="p-4 space-y-3 overflow-y-auto">
      {/* Unassigned Deliveries Warning */}
      {unassigned.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/50 rounded-lg p-3"
        >
          <p className="text-red-300 font-medium text-sm">
            ⚠️ {unassigned.length} unassigned {unassigned.length === 1 ? 'delivery' : 'deliveries'}
          </p>
          <p className="text-red-200 text-xs mt-1">
            {unassigned.map((d) => d.name).join(', ')}
          </p>
        </motion.div>
      )}

      {/* Routes */}
      <AnimatePresence>
        {routes.map((route, idx) => {
          const isExpanded = expandedRoute === idx
          const colorClass = ROUTE_COLORS[idx % ROUTE_COLORS.length]

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gray-700/50 border border-gray-600 rounded-lg overflow-hidden"
            >
              {/* Header */}
              <motion.button
                onClick={() => setExpandedRoute(isExpanded ? -1 : idx)}
                className={`w-full p-4 bg-gradient-to-r ${colorClass} text-white font-bold flex items-center justify-between hover:shadow-lg transition`}
              >
                <span>{route.vehicle.name}</span>
                <motion.span animate={{ rotate: isExpanded ? 180 : 0 }}>
                  ▼
                </motion.span>
              </motion.button>

              {/* Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-800 border-t border-gray-600"
                  >
                    {/* Driver & Timing */}
                    <div className="p-4 border-b border-gray-600 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Driver:</span>
                        <span className="text-white font-medium">{route.driver.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Return Time:</span>
                        <span className="text-white font-mono">{route.return_time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Distance:</span>
                        <span className="text-white font-medium">{route.total_distance} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Weight:</span>
                        <span className="text-white font-medium">{route.total_weight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Estimated Cost:</span>
                        <span className="text-green-400 font-medium">€{route.cost}</span>
                      </div>
                    </div>

                    {/* Stops */}
                    <div className="p-4 space-y-3">
                      <p className="text-gray-400 text-xs font-semibold uppercase">
                        {route.stops.length} Stops
                      </p>
                      {route.stops.map((stop, sidx) => (
                        <motion.div
                          key={sidx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: sidx * 0.05 }}
                          className={`p-3 bg-gray-700/50 rounded-lg border ${
                            stop.status === 'late'
                              ? 'border-red-500/50'
                              : 'border-gray-600'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <p className="font-medium text-white">{sidx + 1}. {stop.name}</p>
                              <p className={`text-xs font-semibold ${TYPE_COLOR[stop.type] || 'text-gray-400'}`}>
                                {stop.type.toUpperCase()}
                                {stop.priority === 'urgent' && ' • URGENT'}
                              </p>
                            </div>
                            <span className="text-gray-400 text-xs font-mono whitespace-nowrap ml-2">
                              {stop.arrival}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{stop.weight} kg{stop.refrigerated && ' • ❄️'}</span>
                            <span>{stop.distance_from_prev} km</span>
                          </div>
                          {stop.status === 'late' && (
                            <p className="text-red-400 text-xs mt-1">⚠️ Arrival after closing time</p>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Violations */}
                    {route.violations.length > 0 && (
                      <div className="p-4 border-t border-gray-600 bg-red-500/10">
                        <p className="text-red-300 text-xs font-semibold mb-2">⚠️ Constraint Violations:</p>
                        <ul className="space-y-1">
                          {route.violations.map((v, i) => (
                            <li key={i} className="text-red-200 text-xs">• {v}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
