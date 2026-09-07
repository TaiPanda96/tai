import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasVisitedLanding, markLandingVisited, useReducedMotion } from '../hooks'
import { CardFace } from '../components/CardFace'
import { FlipIcon, SoundIcon } from '../components/Icons'
import { soundtrack, useSoundEnabled } from '../soundtrack'
import { isLocalPreview, useMotionSettings } from '../motion'
import type { Phase } from '../components/BusinessScene'
import { navigateWithCard } from '../cardTransition'

// Begin the download with the landing module, before mounting the scene.
const sceneModule = import('../components/BusinessScene')
const BusinessScene = lazy(() => sceneModule)
const MotionPalette = lazy(() => import('../components/MotionPalette'))

class SceneBoundary extends Component<{ children: ReactNode; onFailed: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailed() }
  render() { return this.state.failed ? null : this.props.children }
}

export function Landing() {
  const reduced = useReducedMotion()
  const [visit] = useState(() => ({ first: !hasVisitedLanding() }))
  const [phase, setPhase] = useState<Phase>(() => !visit.first || reduced ? 'open' : 'closed')
  const [back, setBack] = useState(false)
  const [ready, setReady] = useState(false)
  const [enhanced, setEnhanced] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [profiles, setProfiles] = useMotionSettings()
  const surface = phase === 'open' ? 'card' : 'holder'
  const settings = profiles[surface]
  const [surfaceHovered, setSurfaceHovered] = useState(false)
  const soundEnabled = useSoundEnabled()
  const pointer = useRef({ x: 0, y: 0 })
  const lastPointer = useRef<{ x: number; y: number } | null>(null)
  const locked = useRef(false)
  const landing = useRef<HTMLElement>(null)
  const background = useRef({ x: 0, y: 0 })
  const enhancedRef = useRef(enhanced)
  enhancedRef.current = enhanced
  const fallbackOpening = useRef(false)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const navigate = useNavigate()
  const flipRef = useRef<HTMLButtonElement>(null)
  const focusAfterOpen = useRef(false)

  const open = useCallback(() => {
    if (phaseRef.current !== 'closed') return
    fallbackOpening.current = !enhancedRef.current
    focusAfterOpen.current = true
    soundtrack.open()
    setSurfaceHovered(false)
    setPhase('opening')
  }, [])
  const opened = useCallback(() => setPhase('open'), [])
  const sceneReady = useCallback(() => setReady(true), [])
  const sceneFailed = useCallback(() => { setReady(false); setEnhanced(false) }, [])
  const interaction = useCallback((active: boolean) => { locked.current = active }, [])
  const hover = useCallback((active: boolean) => setSurfaceHovered(active && phaseRef.current !== 'opening'), [])
  const go = useCallback((path: string) => { soundtrack.fadeAll(); navigateWithCard(navigate, path) }, [navigate])

  useEffect(() => {
    document.title = 'Tai Shan Lin - Founding Engineer'
    soundtrack.beginVisit(visit.first)
    markLandingVisited()
    const prepare = window.setTimeout(soundtrack.prepare, 1500)
    return () => { clearTimeout(prepare); soundtrack.leaveVisit() }
  }, [visit])
  useEffect(() => {
    if (phase !== 'opening' || !fallbackOpening.current) return
    const timer = window.setTimeout(opened, reduced ? 0 : 950)
    return () => clearTimeout(timer)
  }, [phase, opened, reduced])
  useEffect(() => {
    if (!ready || enhanced || phase === 'opening') return
    let frame = 0
    const promote = () => {
      if (document.documentElement.dataset.cardFlight === 'to-card' || locked.current || document.activeElement?.closest('.instant-scene')) { frame = requestAnimationFrame(promote); return }
      fallbackOpening.current = false
      setEnhanced(true)
    }
    frame = requestAnimationFrame(promote)
    return () => cancelAnimationFrame(frame)
  }, [ready, enhanced, phase])
  useEffect(() => {
    if (phase !== 'open') return
    soundtrack.reveal()
    if (focusAfterOpen.current) { flipRef.current?.focus({ preventScroll: true }); focusAfterOpen.current = false }
    const frame = requestAnimationFrame(() => {
      const p = lastPointer.current
      if (p && document.elementFromPoint(p.x, p.y)?.closest('[data-cursor="card"]')) hover(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [phase, enhanced, hover])
  useEffect(() => {
    let frame = 0, previous = performance.now()
    const tick = (time: number) => {
      const alpha = 1 - Math.exp(-settings.speed * Math.min(0.05, (time - previous) / 1000))
      previous = time
      if (!locked.current) {
        background.current.x += ((reduced ? 0 : pointer.current.x) - background.current.x) * alpha
        background.current.y += ((reduced ? 0 : pointer.current.y) - background.current.y) * alpha
      }
      const { x, y } = background.current
      landing.current?.style.setProperty('--ambient-x', `${-x * settings.background}px`)
      landing.current?.style.setProperty('--ambient-y', `${-y * settings.background}px`)
      landing.current?.style.setProperty('--instant-x', `${x * settings.travel}px`)
      landing.current?.style.setProperty('--instant-y', `${y * settings.travel * 0.65}px`)
      landing.current?.style.setProperty('--instant-rx', `${-y * settings.tiltX}deg`)
      landing.current?.style.setProperty('--instant-ry', `${x * settings.tiltY}deg`)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [settings, reduced])

  const replay = () => {
    soundtrack.replay()
    locked.current = false
    fallbackOpening.current = false
    focusAfterOpen.current = false
    pointer.current = { x: 0, y: 0 }
    setSurfaceHovered(false)
    setBack(false); setReady(false); setEnhanced(false)
    setPhase(reduced ? 'open' : 'closed')
    setGeneration(value => value + 1)
  }

  return <main ref={landing} className={`landing landing--${phase}`} data-phase={phase} data-renderer={enhanced ? 'three' : 'instant'} style={{ '--surface-scale': reduced || !surfaceHovered || phase === 'opening' ? 1 : 1 + settings.lift / 100 } as CSSProperties}>
    <div className="landing-composition">
      <div className="scene-stage" onPointerDownCapture={() => { if (phase === 'open') soundtrack.unlock() }} onPointerMove={event => {
        if (event.pointerType !== 'mouse' || (event.target as Element).closest('[data-motion-controls], .scene-controls')) return
        lastPointer.current = { x: event.clientX, y: event.clientY }
        // The card can appear under a stationary pointer without a pointerenter event.
        hover(Boolean((event.target as Element).closest('[data-cursor="card"], .holder-hit-target, .instant-holder-button')))
        const rect = event.currentTarget.getBoundingClientRect()
        const width = Math.max(140, Math.min(600, rect.width * 0.82, (rect.height - 180) * 1.75))
        pointer.current = { x: Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / width * 2)), y: Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / (width / 1.75) * 2)) }
      }} onPointerLeave={event => {
        if (event.relatedTarget instanceof Element && event.relatedTarget.closest('[data-motion-controls]')) return
        pointer.current = { x: 0, y: 0 }; lastPointer.current = null; hover(false)
      }}>
        <div className={`instant-scene ${enhanced ? 'is-hidden' : ''}`} inert={enhanced} aria-hidden={enhanced}>
          <div className="instant-card-wrap" inert={phase === 'closed'} aria-hidden={phase === 'closed'}>
            <div className="static-card"><CardFace back={back} onNavigate={go} onLeave={soundtrack.fadeAll} onSurfaceHover={hover} onInteractionChange={interaction} /></div>
          </div>
          {phase !== 'open' && <div className="instant-holder">
            <button className="instant-holder-button" aria-label="Open Tai’s card holder" onClick={open} disabled={phase !== 'closed'} onPointerEnter={() => { soundtrack.prepare(); hover(true) }} onPointerLeave={() => hover(false)}>
              <img src="/holder-poster.webp" alt="" width="780" height="550" fetchPriority="high" draggable="false" />
            </button>
          </div>}
        </div>
        <div className={`scene-webgl ${enhanced ? 'is-active' : ''}`} inert={!enhanced} aria-hidden={!enhanced}>
          <SceneBoundary key={generation} onFailed={sceneFailed}>
            <Suspense fallback={null}>
              <BusinessScene phase={fallbackOpening.current ? 'open' : phase} back={back} reduced={reduced} pointer={pointer} settings={settings} hovered={surfaceHovered} locked={locked} onOpen={open} onOpened={opened} onReady={sceneReady} onNavigate={go} onSurfaceHover={hover} onInteractionChange={interaction} onLeave={soundtrack.fadeAll} />
            </Suspense>
          </SceneBoundary>
        </div>
        <div className="scene-controls">
          {phase === 'open' && <button ref={flipRef} className="scene-action scene-action--flip" onClick={() => { soundtrack.unlock(); setBack(value => !value) }} aria-pressed={back}><FlipIcon />{back ? 'Back to card' : 'About Me'}</button>}
          <button className="scene-action sound-toggle" aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'} aria-pressed={soundEnabled} title={soundEnabled ? 'Mute sound' : 'Enable sound'} onClick={soundtrack.toggle}><SoundIcon enabled={soundEnabled} /></button>
        </div>
      </div>
    </div>
    {phase !== 'open' && <h1 className="sr-only">Tai Shan Lin - Founding Engineer</h1>}
    {isLocalPreview && <Suspense fallback={null}><MotionPalette surface={surface} settings={settings} onChange={next => setProfiles({ ...profiles, [surface]: next })} onReplay={replay} /></Suspense>}
  </main>
}
