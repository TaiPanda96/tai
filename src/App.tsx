import { lazy, Suspense, useEffect, useRef } from 'react'
import { Link, Route, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Arrow } from './components/Icons'
import { RetroCursor } from './components/RetroCursor'
import { loadIndex, loadStudy } from './routeModules'

const IndexPage = lazy(() => loadIndex().then(module => ({ default: module.IndexPage })))
const CaseStudy = lazy(() => loadStudy().then(module => ({ default: module.CaseStudy })))

function RouteEffects() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, number>())
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const id = decodeURIComponent(location.hash.slice(1))
      const target = id ? document.getElementById(id) : null
      const saved = positions.current.get(location.key)
      if (navigationType === 'POP' && saved !== undefined) window.scrollTo({ top: saved, behavior: 'instant' })
      else if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' })
      else window.scrollTo({ top: 0, behavior: 'instant' })
      if (location.pathname !== '/') {
        const heading = target?.querySelector<HTMLElement>('h2') ?? document.querySelector<HTMLElement>('main h1')
        heading?.focus({ preventScroll: true })
      }
    })
    const remember = () => { positions.current.set(location.key, window.scrollY) }
    window.addEventListener('scroll', remember, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', remember) }
  }, [location.pathname, location.hash, location.key, navigationType])
  return null
}

export function App() {
  return <div className="app-shell">
    <div className="site-backdrop" aria-hidden="true" />
    <RetroCursor />
    <Suspense fallback={null}><RouteEffects /><Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/index" element={<IndexPage />} />
      <Route path="/work/:slug" element={<CaseStudy />} />
      <Route path="/projects/:slug" element={<CaseStudy />} />
      <Route path="*" element={<main className="not-found"><p className="eyebrow">A loose end</p><h1 tabIndex={-1}>Nothing here, just yet.</h1><Link className="back-link" to="/"><Arrow />Back to Tai’s card</Link></main>} />
    </Routes></Suspense>
  </div>
}
