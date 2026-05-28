import { useState, useEffect } from 'react'
import Homepage from './pages/Homepage'
import Planner from './pages/Planner'

export default function App() {
  const getInitialPage = () => {
    const path = window.location.pathname
    if (path === '/planner' || path === '/plan') {
      return 'planner'
    }
    return 'home'
  }

  const [page, setPage] = useState(getInitialPage)

  useEffect(() => {
    const handleNavigation = (e) => {
      const target = e.target.closest('a')
      if (target && target.href) {
        const path = target.getAttribute('href')
        if (path === '/' || path === '/home') {
          e.preventDefault()
          setPage('home')
          window.history.pushState(null, '', '/')
        } else if (path === '/planner' || path === '/plan') {
          e.preventDefault()
          setPage('planner')
          window.history.pushState(null, '', '/planner')
        }
      }
    }

    document.addEventListener('click', handleNavigation)
    return () => document.removeEventListener('click', handleNavigation)
  }, [])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/planner' || path === '/plan') {
        setPage('planner')
      } else {
        setPage('home')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return page === 'planner' ? <Planner /> : <Homepage />
}
