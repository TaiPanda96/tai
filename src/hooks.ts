import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

const VISIT_KEY = 'tai:landing-visited:v1'
let visitedInMemory = false

export function hasVisitedLanding() {
  try { return sessionStorage.getItem(VISIT_KEY) === 'true' || visitedInMemory }
  catch { return visitedInMemory }
}

export function markLandingVisited() {
  visitedInMemory = true
  try { sessionStorage.setItem(VISIT_KEY, 'true') } catch { /* Memory preserves navigation behavior when storage is unavailable. */ }
}
