import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Homepage() {
  const [stats, setStats] = useState({ routes: 0, deliveries: 0, km: 0 })

  useEffect(() => {
    // Animate stats on load
    const target = { routes: 12, deliveries: 847, km: 3240 }
    let progress = 0
    const interval = setInterval(() => {
      progress += 0.05
      if (progress >= 1) {
        setStats(target)
        clearInterval(interval)
      } else {
        setStats({
          routes: Math.round(target.routes * progress),
          deliveries: Math.round(target.deliveries * progress),
          km: Math.round(target.km * progress),
        })
      }
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const handleNavigateToPlan = () => {
    window.history.pushState(null, '', '/planner')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"
          animate={{ y: [0, 50, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ y: [0, -50, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-md bg-black/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">MD</span>
            </div>
            <span className="text-white font-bold text-lg">MediDéliv</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
            <a href="#about" className="text-gray-300 hover:text-white transition">About</a>
            <button
              onClick={handleNavigateToPlan}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition font-medium"
            >
              Launch Planner
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto px-6 py-24"
      >
        <motion.div variants={itemVariants} className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Medical Delivery <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Optimization</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Intelligent route planning for medical logistics. Optimize delivery schedules,
            minimize costs, and ensure on-time delivery windows for critical medical goods.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <button
              onClick={handleNavigateToPlan}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg transition font-bold text-lg"
            >
              Start Planning →
            </button>
            <a
              href="#features"
              className="border border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-lg transition font-bold inline-flex items-center"
            >
              Explore Features
            </a>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-6 mt-20"
        >
          {[
            { label: 'Active Routes', value: stats.routes || '—', icon: '🚚' },
            { label: 'Deliveries Today', value: stats.deliveries || '—', icon: '📦' },
            { label: 'Total Distance', value: `${stats.km || '—'} km`, icon: '🗺️' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-white/30 transition"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-7xl mx-auto px-6 py-24"
      >
        <h2 className="text-4xl font-bold text-white mb-12">Powerful Features</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Smart Routing', desc: 'AI-powered algorithm that optimizes delivery sequences using nearest-neighbor + 2-opt local search', icon: '🤖' },
            { title: 'Constraint Handling', desc: '24h delivery windows, capacity limits, time windows, and refrigeration requirements', icon: '✅' },
            { title: 'Deduplication', desc: 'Automatically merges duplicate addresses and combines weights for the same location', icon: '📍' },
            { title: 'Cost Analysis', desc: 'Detailed cost breakdowns and performance metrics per route', icon: '💰' },
            { title: 'Fleet Management', desc: 'Manage multiple vehicle types and drivers with automatic assignment', icon: '🚗' },
            { title: 'Real-time Stats', desc: 'Live tracking of deliveries, routes, and distances across your fleet', icon: '📊' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/10 hover:border-green-500/50 transition"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        id="about"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-4xl mx-auto px-6 py-24"
      >
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to optimize your deliveries?</h2>
          <p className="text-gray-300 text-lg mb-8">
            Start planning your first route in minutes with our intelligent logistics platform.
          </p>
          <button
            onClick={handleNavigateToPlan}
            className="inline-block bg-green-500 hover:bg-green-600 text-white px-10 py-4 rounded-lg transition font-bold text-lg"
          >
            Launch Planner Now
          </button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-md bg-black/50 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-400">
          <p>&copy; 2025 MediDéliv Medical Delivery Logistics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}