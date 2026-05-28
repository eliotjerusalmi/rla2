import { motion } from 'framer-motion'

export default function StatsBar({ routes }) {
  const stats = {
    routes: routes.length,
    stops: routes.reduce((sum, r) => sum + r.stops.length, 0),
    distance: Math.round(routes.reduce((sum, r) => sum + r.total_distance, 0) * 10) / 10,
    weight: routes.reduce((sum, r) => sum + r.total_weight, 0),
    cost: Math.round(routes.reduce((sum, r) => sum + r.cost, 0) * 100) / 100,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-gray-700 bg-gray-900/50 backdrop-blur-sm p-3 space-y-3"
    >
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label: 'Routes', value: stats.routes, icon: '🚚' },
          { label: 'Stops', value: stats.stops, icon: '📍' },
          { label: 'Distance', value: `${stats.distance} km`, icon: '🗺️' },
          { label: 'Weight', value: `${stats.weight} kg`, icon: '⚖️' },
          { label: 'Cost', value: `€${stats.cost}`, icon: '💰' },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-800/50 border border-gray-700 rounded p-2">
            <p className="text-gray-500 font-semibold">{stat.icon}</p>
            <p className="text-white font-bold text-sm">{stat.value}</p>
            <p className="text-gray-400 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
