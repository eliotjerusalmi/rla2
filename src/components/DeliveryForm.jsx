import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ADDRESSES, TIME_WINDOWS } from '../utils'

export default function DeliveryForm({ onAddDelivery, addresses }) {
  const [selectedAddress, setSelectedAddress] = useState('')
  const [weight, setWeight] = useState('')
  const [priority, setPriority] = useState('normal')
  const [refrigerated, setRefrigerated] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedAddress) return

    const addr = addresses.find((a) => a.name === selectedAddress)
    if (!addr) return

    onAddDelivery({
      name: addr.name,
      address: addr.name,
      lat: addr.lat,
      lon: addr.lon,
      type: addr.type,
      weight: parseFloat(weight) || 0,
      priority,
      refrigerated,
    })

    setSelectedAddress('')
    setWeight('')
    setPriority('normal')
    setRefrigerated(false)
  }

  const selectedAddr = addresses.find((a) => a.name === selectedAddress)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Address Select with Search Feel */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
          📍 Select Location
        </label>
        <div className="relative">
          <select
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/50 focus:outline-none transition appearance-none cursor-pointer"
            required
          >
            <option value="">Choose a place...</option>
            {addresses.map((addr) => (
              <option key={addr.name} value={addr.name}>
                {addr.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">
            ▼
          </div>
        </div>
      </div>

      {/* Selected Place Preview Card */}
      <AnimatePresence>
        {selectedAddr && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4 overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-bold text-sm">{selectedAddr.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {selectedAddr.lat.toFixed(4)}, {selectedAddr.lon.toFixed(4)}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                selectedAddr.type === 'pharmacy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                selectedAddr.type === 'clinic' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              }`}>
                {selectedAddr.type === 'pharmacy' ? '💊 Pharmacy' :
                 selectedAddr.type === 'clinic' ? '🏥 Clinic' : '🏨 Hospital'}
              </span>
            </div>
            {(() => {
              const tw = TIME_WINDOWS[selectedAddr.type] || ['08:00', '18:00']
              return (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <span>🕐</span>
                  <span>Available: <span className="text-gray-300">{tw[0]} – {tw[1]}</span></span>
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weight Input */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
          ⚖️ Weight (kg)
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 25.5"
            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/50 focus:outline-none transition"
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-bold">KG</span>
        </div>
      </div>

      {/* Priority Toggle */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
          🔥 Priority Level
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPriority('normal')}
            className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${
              priority === 'normal'
                ? 'bg-gray-700 border-green-500 text-white shadow-lg shadow-green-500/20'
                : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            <span className="block text-lg mb-0.5">●</span>
            Normal
          </button>
          <button
            type="button"
            onClick={() => setPriority('urgent')}
            className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${
              priority === 'urgent'
                ? 'bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-500/20'
                : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            <span className="block text-lg mb-0.5">🚨</span>
            Urgent
          </button>
        </div>
      </div>

      {/* Refrigerated Toggle */}
      <div
        onClick={() => setRefrigerated(!refrigerated)}
        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
          refrigerated
            ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
            : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'
        }`}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
          refrigerated ? 'bg-cyan-500/20' : 'bg-gray-700'
        }`}>
          ❄️
        </div>
        <div className="flex-1">
          <p className={`text-sm font-bold ${refrigerated ? 'text-cyan-400' : 'text-gray-300'}`}>
            Requires Refrigeration
          </p>
          <p className="text-xs text-gray-500">Cold chain delivery (vaccines, blood, etc.)</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          refrigerated ? 'border-cyan-500 bg-cyan-500' : 'border-gray-600'
        }`}>
          {refrigerated && <span className="text-white text-xs">✓</span>}
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-green-500/25 text-sm tracking-wide"
      >
        ➕ Add Delivery
      </motion.button>
    </form>
  )
}