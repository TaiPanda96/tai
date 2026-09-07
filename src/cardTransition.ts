import { markLandingVisited } from './hooks'

let renderSnapshot: (() => string) | undefined
let cancelFlight: (() => void) | undefined

export function registerCardSnapshot(capture: () => string) {
  renderSnapshot = capture
  return () => { if (renderSnapshot === capture) renderSnapshot = undefined }
}

function exposedFace() {
  return [...document.querySelectorAll<HTMLElement>('.landing .card-face')].find(node =>
    !node.closest('[inert]') && getComputedStyle(node).visibility === 'visible',
  )
}

// Flatten the projected HTML face before moving it out of the Three.js scene.
// Keeping Drei's nested perspective transforms changes their paint position in a new layer.
function projectedFace(face: HTMLElement, bounds: DOMRect) {
  const width = face.offsetWidth, height = face.getBoundingClientRect().height
  const localHeight = parseFloat(getComputedStyle(face).height) || height
  const points = [[0, 0], [width, 0], [width, localHeight], [0, localHeight]].map(([x, y]) => {
    const probe = document.createElement('span')
    Object.assign(probe.style, { position: 'absolute', left: `${x}px`, top: `${y}px`, width: '0', height: '0' })
    face.append(probe)
    const point = probe.getBoundingClientRect()
    probe.remove()
    return { x: point.x - bounds.x, y: point.y - bounds.y }
  })
  const [p0, p1, p2, p3] = points
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y
  const denominator = dx1 * dy2 - dx2 * dy1
  const g = (dx3 * dy2 - dx2 * dy3) / denominator
  const h = (dx1 * dy3 - dx3 * dy1) / denominator
  const matrix = [
    (p1.x - p0.x + g * p1.x) / width, (p1.y - p0.y + g * p1.y) / width, 0, g / width,
    (p3.x - p0.x + h * p3.x) / localHeight, (p3.y - p0.y + h * p3.y) / localHeight, 0, h / localHeight,
    0, 0, 1, 0, p0.x, p0.y, 0, 1,
  ]
  const copy = face.cloneNode(true) as HTMLElement
  Object.assign(copy.style, { position: 'absolute', left: '0', top: '0', transformOrigin: '0 0', transform: `matrix3d(${matrix.join(',')})` })
  return { copy, points }
}

function cloneScene(face: HTMLElement): HTMLElement {
  const scene = face.closest<HTMLElement>('.scene-webgl')
  const bounds = face.getBoundingClientRect()
  const visual = document.createElement('div')
  Object.assign(visual.style, { position: 'absolute', inset: '0' })
  if (scene && renderSnapshot) {
    const { copy, points } = projectedFace(face, bounds)
    const rect = scene.getBoundingClientRect()
    const image = document.createElement('img')
    image.src = renderSnapshot()
    Object.assign(image.style, { position: 'absolute', left: `${rect.x - bounds.x}px`, top: `${rect.y - bounds.y}px`, width: `${rect.width}px`, height: `${rect.height}px`, maxWidth: 'none' })
    // Clip the paper silhouette so the studio's cast shadow cannot become a rectangular crop.
    visual.style.clipPath = `polygon(${points.map(point => `${point.x}px ${point.y}px`).join(',')})`
    visual.append(image, copy)
  } else {
    const paper = face.closest('.static-card')?.cloneNode(true) as HTMLElement | undefined
    if (paper) {
      Object.assign(paper.style, { width: '100%', height: '100%', scale: '1', transform: 'none' })
      visual.append(paper)
    }
  }
  return visual
}

// This layer outlives either route. Its contents are visual copies, never live controls.
export function navigateWithCard(navigate: (path: string) => unknown, path: string) {
  cancelFlight?.()
  const home = path === '/'
  if (home) markLandingVisited()
  const source = home ? document.querySelector<HTMLElement>('[data-card-anchor]') : exposedFace()
  if (!source || matchMedia('(prefers-reduced-motion: reduce)').matches) { navigate(path); return }

  const from = source.getBoundingClientRect()
  const layer = document.createElement('div')
  layer.className = 'card-flight'
  layer.inert = true
  layer.setAttribute('aria-hidden', 'true')
  let animation: Animation | undefined
  let frame = 0
  let timeout = 0
  const finish = () => {
    cancelAnimationFrame(frame)
    clearTimeout(timeout)
    animation?.cancel()
    layer.remove()
    delete document.documentElement.dataset.cardFlight
    window.removeEventListener('resize', finish)
    window.removeEventListener('popstate', finish)
    if (cancelFlight === finish) cancelFlight = undefined
  }
  const place = (rect: DOMRect) => Object.assign(layer.style, { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` })
  place(from)
  try { layer.append(home ? source.cloneNode(true) : cloneScene(source)) }
  catch { navigate(path); return }
  document.body.append(layer)
  document.documentElement.dataset.cardFlight = home ? 'to-card' : 'to-index'
  cancelFlight = finish
  window.addEventListener('resize', finish, { once: true })
  window.addEventListener('popstate', finish, { once: true })
  navigate(path)

  const started = performance.now()
  const arrive = () => {
    const target = home ? document.querySelector<HTMLElement>('.landing .instant-scene .static-card') : document.querySelector<HTMLElement>('[data-card-anchor]')
    if (!target || (home && !document.querySelector('.landing--open'))) {
      if (performance.now() - started > 1200) { finish(); return }
      frame = requestAnimationFrame(arrive)
      return
    }
    const to = target.getBoundingClientRect()
    if (home) {
      place(to)
      const paper = target.cloneNode(true) as HTMLElement
      Object.assign(paper.style, { width: '100%', height: '100%', scale: '1', transform: 'none' })
      layer.replaceChildren(paper)
    }
    const transform = home
      ? `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.width / to.width}, ${from.height / to.height})`
      : `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(${to.width / from.width}, ${to.height / from.height})`
    animation = layer.animate(home ? [{ transform }, { transform: 'none' }] : [{ transform: 'none' }, { transform }], {
      duration: 440, easing: 'cubic-bezier(.22,.75,.18,1)', fill: 'forwards',
    })
    void animation.finished.then(finish).catch(() => {})
  }
  frame = requestAnimationFrame(arrive)
  timeout = window.setTimeout(finish, 1800)
}
