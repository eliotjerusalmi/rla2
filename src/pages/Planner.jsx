import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  VEHICLE_TYPES,
  DEFAULT_FLEET,
  ADDRESSES,
  planDeliveries,
  MAX_TOTAL_WEIGHT,
} from '../utils'
import DeliveryForm from '../components/DeliveryForm'
import DeliveryMap from '../components/DeliveryMap'

// Simple inline components to avoid external dependencies crashing
function SimpleRoutesList({ routes, unassigned }) {
  if (!routes || routes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
        <div className="text-5xl mb-3">📋</div>
        <p className="text-center text-sm">No routes to display.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-bold text-green-400">📊 Route Results</h3>
      {routes.map((route, idx) => (
        <div key={idx} className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{route.vehicle?.icon || '🚐'}</span>
              <div>
                <p className="text-sm font-bold text-white">{route.vehicle?.name || 'Unknown Van'}</p>
                <p className="text-xs text-gray-500">
                  {route.vehicle?.size === 'big' ? 'Big' : 'Small'} · 
                  {route.vehicle?.refrigerated ? ' ❄️ Fridge' : ' Normal'} · 
                  {route.vehicle?.capacity || 0}kg cap
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{route.stops?.length || 0} stops</p>
              <p className="text-xs text-green-400 font-bold">{route.total_distance?.toFixed(1) || 0} km</p>
            </div>
          </div>

          <div className="space-y-2">
            {(route.stops || []).map((stop, sidx) => (
              <div key={sidx} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-2">
                <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                  {stop.sequence + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{stop.name}</p>
                  <p className="text-xs text-gray-500">
                    {stop.arrival} · {stop.weight}kg · {stop.distance_from_prev}km
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  stop.status === 'late' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {stop.status === 'late' ? 'Late' : 'On Time'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-700/50 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500">Weight</p>
              <p className="text-sm font-bold text-white">{route.total_weight || 0} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Cost</p>
              <p className="text-sm font-bold text-white">€{route.cost?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Return</p>
              <p className="text-sm font-bold text-white">{route.return_time || '--:--'}</p>
            </div>
          </div>
        </div>
      ))}

      {unassigned && unassigned.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm font-bold text-red-400 mb-2">⚠️ Unassigned Deliveries</p>
          {unassigned.map((u, i) => (
            <p key={i} className="text-xs text-red-300">{u.name} ({u.weight}kg)</p>
          ))}
        </div>
      )}
    </div>
  )
}

function SimpleStatsBar({ routes }) {
  if (!routes || routes.length === 0) return null

  const totalDistance = routes.reduce((s, r) => s + (r.total_distance || 0), 0)
  const totalCost = routes.reduce((s, r) => s + (r.cost || 0), 0)
  const totalStops = routes.reduce((s, r) => s + (r.stops?.length || 0), 0)
  const totalViolations = routes.reduce((s, r) => s + (r.violations?.length || 0), 0)

  return (
    <div className="bg-gray-900/90 border-t border-gray-700 p-3">
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-500">Routes</p>
          <p className="text-lg font-bold text-green-400">{routes.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Distance</p>
          <p className="text-lg font-bold text-blue-400">{totalDistance.toFixed(1)} km</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Cost</p>
          <p className="text-lg font-bold text-yellow-400">€{totalCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Issues</p>
          <p className={`text-lg font-bold ${totalViolations > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {totalViolations}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Planner() {
  const [deliveries, setDeliveries] = useState([])
  const [routes, setRoutes] = useState([])
  const [unassigned, setUnassigned] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('form')
  const [toast, setToast] = useState(null)
  const [error, setError] = useState(null)

  const [fleetConfig, setFleetConfig] = useState({ ...DEFAULT_FLEET })

  const totalVehicles = (fleetConfig.big_normal || 0) + (fleetConfig.big_fridge || 0) + 
                        (fleetConfig.small_normal || 0) + (fleetConfig.small_fridge || 0)
  const totalCapacity = 
    (fleetConfig.big_normal || 0) * VEHICLE_TYPES.big_normal.capacity +
    (fleetConfig.big_fridge || 0) * VEHICLE_TYPES.big_fridge.capacity +
    (fleetConfig.small_normal || 0) * VEHICLE_TYPES.small_normal.capacity +
    (fleetConfig.small_fridge || 0) * VEHICLE_TYPES.small_fridge.capacity

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (deliveries.length > 0 && routes.length > 0) {
      try {
        const result = planDeliveries(deliveries, fleetConfig)
        setRoutes(result.routes)
        setUnassigned(result.unassigned)
      } catch (err) {
        showToast(err.message, 'error')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetConfig.big_normal, fleetConfig.big_fridge, fleetConfig.small_normal, fleetConfig.small_fridge])

  const addDelivery = (delivery) => {
    const currentTotal = deliveries.reduce((s, d) => s + (d.weight || 0), 0)
    const newTotal = currentTotal + (delivery.weight || 0)
    if (newTotal > MAX_TOTAL_WEIGHT) {
      showToast(`Cannot add: total would reach ${newTotal} kg (max ${MAX_TOTAL_WEIGHT} kg)`, 'error')
      return
    }
    setDeliveries([...deliveries, { ...delivery, id: `LIV${Date.now()}` }])
    showToast(`Delivery added: ${delivery.name}`, 'success')
  }

  const removeDelivery = (id) => {
    setDeliveries(deliveries.filter((d) => d.id !== id))
    showToast('Delivery removed', 'info')
  }

  const handlePlanDeliveries = async () => {
    setError(null)
    if (deliveries.length === 0) {
      showToast('Add deliveries first', 'warning')
      return
    }
    if (totalVehicles === 0) {
      showToast('Select at least one vehicle', 'warning')
      return
    }

    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      const result = planDeliveries(deliveries, fleetConfig)

      // Validate result
      if (!result || !result.routes) {
        throw new Error('Planning returned invalid result')
      }

      setRoutes(result.routes)
      setUnassigned(result.unassigned || [])
      setActiveTab('results')
      showToast(`${result.routes.length} routes planned!`, 'success')
    } catch (error) {
      console.error('Plan error:', error)
      setError(error.message)
      showToast('Planning failed: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = () => {
    setDeliveries([])
    setRoutes([])
    setUnassigned([])
    setError(null)
    showToast('All data cleared', 'info')
  }

  const updateFleet = (key, delta) => {
    setFleetConfig(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min(10, (prev[key] || 0) + delta))
    }))
  }

  const deliveryWeight = deliveries.reduce((s, d) => s + (d.weight || 0), 0)
  const weightPct = totalCapacity > 0 ? Math.min((deliveryWeight / totalCapacity) * 100, 100) : 0
  const overCapacity = deliveryWeight > totalCapacity && totalCapacity > 0

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gradient-to-r from-gray-800/80 to-gray-800/40 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <button onClick={() => { window.history.pushState(null, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')) }} className="flex items-center space-x-2 hover:opacity-80 transition">
            <div className="w-9 h-9 bg-gradient-to-br from-green-400 via-green-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-black">M</span>
            </div>
            <span className="text-white font-bold text-lg">MediDéliv</span>
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium text-green-400 text-lg">{deliveries.length}</span>
            <span className="text-gray-400 ml-1">deliveries</span>
          </div>
          <div className="w-px h-6 bg-gray-700"></div>
          <div className="text-sm">
            <span className="font-medium text-blue-400 text-lg">{totalVehicles}</span>
            <span className="text-gray-400 ml-1">vans</span>
          </div>
          <div className="w-px h-6 bg-gray-700"></div>
          <button
            onClick={handleClearAll}
            className="text-sm px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-200 rounded-lg transition border border-gray-600 hover:border-gray-500"
          >
            🗑️ Clear
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-[420px] border-r border-gray-700 bg-gray-800 flex flex-col overflow-hidden shadow-lg shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-gray-700/50 bg-gray-800/50 shrink-0">
            {[
              { id: 'form', label: 'Add', icon: '📦' },
              { id: 'fleet', label: 'Fleet', icon: '🚛' },
              { id: 'results', label: 'Routes', icon: '🚚', count: routes.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-3 font-medium transition relative flex items-center justify-center gap-1.5 text-xs ${
                  activeTab === tab.id
                    ? 'border-b-2 border-green-500 text-green-400 bg-gray-800'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 border-b border-gray-700 bg-gray-800/80">
                    <h3 className="text-sm font-bold text-green-400 mb-3">➕ Add New Delivery</h3>
                    <DeliveryForm onAddDelivery={addDelivery} addresses={ADDRESSES} />
                  </div>

                  <div className="p-4">
                    {deliveries.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                          📋 Added Deliveries ({deliveries.length})
                        </div>
                        {deliveries.map((delivery, idx) => (
                          <motion.div
                            key={delivery.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="bg-gray-800/60 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-gray-500 bg-gray-700 px-2 py-0.5 rounded">#{idx + 1}</span>
                                  <p className="text-sm font-bold text-white truncate">{delivery.name}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap mt-1 ml-7">
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    delivery.type === 'pharmacy' ? 'bg-green-500/20 text-green-300' :
                                    delivery.type === 'clinic' ? 'bg-blue-500/20 text-blue-300' :
                                    'bg-purple-500/20 text-purple-300'
                                  }`}>
                                    {delivery.type === 'pharmacy' ? '💊 Pharmacy' :
                                     delivery.type === 'clinic' ? '🏥 Clinic' :
                                     '🏨 Hospital'}
                                  </span>
                                  {delivery.priority === 'urgent' && (
                                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-500/20 text-red-300">
                                      🚨 Urgent
                                    </span>
                                  )}
                                  {delivery.refrigerated && (
                                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-cyan-500/20 text-cyan-300">
                                      ❄️ Cold
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1 ml-7">⚖️ {delivery.weight} kg</p>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => removeDelivery(delivery.id)}
                                className="mt-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-lg"
                              >
                                ✕
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                        <div className="text-3xl mb-2">📦</div>
                        <p className="text-xs text-center">No deliveries yet. Add one above.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="p-4 border-t border-gray-700 space-y-3 bg-gray-800/80 shrink-0">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-xs text-red-400 font-bold">❌ {error}</p>
                    </div>
                  )}
                  <div className="bg-gray-900/80 p-3 rounded-lg border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fleet Capacity</span>
                      <span className={`text-xs font-bold ${overCapacity ? 'text-red-400' : 'text-green-400'}`}>
                        {deliveryWeight} / {totalCapacity} kg
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${overCapacity ? 'bg-red-500' : weightPct > 80 ? 'bg-yellow-400' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(weightPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePlanDeliveries}
                    disabled={loading || deliveries.length === 0 || totalVehicles === 0 || overCapacity}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <span className="animate-spin">⚙️</span>
                        <span>Planning...</span>
                      </span>
                    ) : (
                      `🚀 Plan ${deliveries.length} Deliveries`
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Fleet Tab */}
            {activeTab === 'fleet' && (
              <motion.div
                key="fleet"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-green-400 mb-1">🚛 Configure Your Fleet</h3>
                  <p className="text-xs text-gray-500">Select how many of each van type to use</p>
                </div>

                {/* Big Vans */}
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Big Vans (200kg · 35km/h)</p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-xl relative">
                        🚛
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Big Normal</p>
                        <p className="text-xs text-gray-500">200kg · 35km/h · Normal</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateFleet('big_normal', -1)} className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition">−</button>
                      <span className="w-8 text-center font-bold text-white">{fleetConfig.big_normal}</span>
                      <button onClick={() => updateFleet('big_normal', 1)} className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition">+</button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl relative">
                        🚛
                        <span className="absolute -top-1 -right-1 text-[10px]">❄️</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Big Fridge</p>
                        <p className="text-xs text-gray-500">200kg · 35km/h · Refrigerated</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateFleet('big_fridge', -1)} className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition">−</button>
                      <span className="w-8 text-center font-bold text-white">{fleetConfig.big_fridge}</span>
                      <button onClick={() => updateFleet('big_fridge', 1)} className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition">+</button>
                    </div>
                  </div>
                </div>

                {/* Small Vans */}
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Small Vans (100kg · 50km/h)</p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-xl relative">
                        🚐
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Small Normal</p>
                        <p className="text-xs text-gray-500">100kg · 50km/h · Normal</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateFleet('small_normal', -1)} className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition">−</button>
                      <span className="w-8 text-center font-bold text-white">{fleetConfig.small_normal}</span>
                      <button onClick={() => updateFleet('small_normal', 1)} className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition">+</button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl relative">
                        🚐
                        <span className="absolute -top-1 -right-1 text-[10px]">❄️</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Small Fridge</p>
                        <p className="text-xs text-gray-500">100kg · 50km/h · Refrigerated</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateFleet('small_fridge', -1)} className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition">−</button>
                      <span className="w-8 text-center font-bold text-white">{fleetConfig.small_fridge}</span>
                      <button onClick={() => updateFleet('small_fridge', 1)} className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition">+</button>
                    </div>
                  </div>
                </div>

                {/* Fleet Summary */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                  <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Fleet Summary</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-400">Total Vans:</div>
                    <div className="text-white font-bold text-right">{totalVehicles}</div>
                    <div className="text-gray-400">Total Capacity:</div>
                    <div className="text-white font-bold text-right">{totalCapacity} kg</div>
                    <div className="text-gray-400">Deliveries Weight:</div>
                    <div className={`font-bold text-right ${overCapacity ? 'text-red-400' : 'text-green-400'}`}>{deliveryWeight} kg</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-auto">
                  <SimpleRoutesList routes={routes} unassigned={unassigned} />
                </div>
                <SimpleStatsBar routes={routes} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Map */}
        <div className="flex-1 bg-gray-900 relative shadow-inner min-w-0">
          <DeliveryMap deliveries={deliveries} routes={routes} />
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg font-medium shadow-xl border backdrop-blur-sm z-50 ${
              toast.type === 'success'
                ? 'bg-green-500/20 border-green-500/50 text-green-300'
                : toast.type === 'warning'
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                : toast.type === 'error'
                ? 'bg-red-500/20 border-red-500/50 text-red-300'
                : 'bg-blue-500/20 border-blue-500/50 text-blue-300'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}