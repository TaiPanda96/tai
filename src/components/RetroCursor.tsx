import { useEffect, useRef } from 'react'

export function RetroCursor() {
  const cursor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = cursor.current
    if (!node) return
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    let frame = 0
    let x = 0, y = 0
    const hide = () => {
      node.style.opacity = '0'
      document.documentElement.classList.remove('retro-cursor-active')
    }
    const move = (event: PointerEvent) => {
      if (!query.matches || event.pointerType !== 'mouse') { hide(); return }
      x = event.clientX
      y = event.clientY
      const target = event.target instanceof Element ? event.target : null
      node.dataset.kind = target?.closest('a, button:not(:disabled), [role="button"]') ? 'hand' : 'arrow'
      node.style.opacity = '1'
      document.documentElement.classList.add('retro-cursor-active')
      if (!frame) frame = requestAnimationFrame(() => {
        node.style.transform = `translate3d(${x}px, ${y}px, 0)`
        frame = 0
      })
    }
    const press = () => { node.dataset.pressed = 'true' }
    const release = () => { node.dataset.pressed = 'false' }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', move, { passive: true })
    window.addEventListener('pointerdown', press, { passive: true })
    window.addEventListener('pointerup', release, { passive: true })
    window.addEventListener('pointercancel', release, { passive: true })
    window.addEventListener('blur', hide)
    document.addEventListener('mouseleave', hide)
    query.addEventListener('change', hide)
    return () => {
      cancelAnimationFrame(frame)
      hide()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', move)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('blur', hide)
      document.removeEventListener('mouseleave', hide)
      query.removeEventListener('change', hide)
    }
  }, [])

  return <div ref={cursor} className="retro-cursor" data-kind="arrow" aria-hidden="true">
    <svg className="cursor-arrow" width="12" height="16" viewBox="0 0 12 16" shapeRendering="crispEdges">
      <path fill="#111" d="M0 0h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1H7v1h1v2h1v2H6v-2H5v-2H4v-1H3v1H2v1H1v1H0Z" />
      <path fill="#fff" d="M1 2h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1H6v2h1v2h1v1H7v-1H6v-2H5v-2H3v1H2v1H1Z" />
    </svg>
    <svg className="cursor-hand" width="16" height="18" viewBox="0 0 16 18" shapeRendering="crispEdges">
      <path fill="#111" d="M5 0h3v1h1v4h2v1h2v1h2v1h1v6h-1v2h-1v2H5v-2H4v-1H3v-2H2v-2H1V8h3v1h1Z" />
      <path fill="#fff" d="M6 1h1v1h1v8h1V6h1v4h1V7h1v4h1V8h1v1h1v4h-1v2h-1v2H6v-2H5v-1H4v-2H3v-2H2V9h1v1h1v1h2Z" />
    </svg>
  </div>
}
