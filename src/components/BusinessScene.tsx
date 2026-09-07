import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Html, Lightformer, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { CardFace } from './CardFace'
import { lidClipPath } from './cardOcclusion'
import type { MotionSettings } from '../motion'
import { registerCardSnapshot } from '../cardTransition'

export type Phase = 'closed' | 'opening' | 'open'
type Props = {
  phase: Phase
  back: boolean
  reduced: boolean
  pointer: RefObject<{ x: number; y: number }>
  settings: MotionSettings
  hovered: boolean
  locked: RefObject<boolean>
  onOpen: () => void
  onOpened: () => void
  onReady: () => void
  onNavigate: (path: string) => void
  onSurfaceHover: (active: boolean) => void
  onInteractionChange: (active: boolean) => void
  onLeave: () => void
}

const CARD_W = 5.4
const CARD_H = CARD_W * 2 / 3.5
const CASE_W = 5.78
const CASE_H = 3.46

function roundedShape(w: number, h: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2, y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

function makeSlab(w: number, h: number, depth: number, radius: number, bevel: number) {
  const geo = new THREE.ExtrudeGeometry(roundedShape(w - bevel * 2, h - bevel * 2, radius), {
    depth: Math.max(0.002, depth - bevel * 2), bevelEnabled: true,
    bevelSegments: 3, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 10,
  })
  geo.center()
  const uv = geo.attributes.uv
  const pos = geo.attributes.position
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h)
  return geo
}

function makeRim(w: number, h: number, thickness: number, depth: number) {
  const shape = roundedShape(w, h, 0.11)
  const hole = roundedShape(w - thickness * 2, h - thickness * 2, 0.075)
  shape.holes.push(new THREE.Path(hole.getPoints(32)))
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.018, bevelThickness: 0.012, curveSegments: 12 })
  geo.center()
  return geo
}

function makeTexture(kind: 'paper' | 'steel') {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const pixels = ctx.createImageData(512, 512)
  let seed = kind === 'paper' ? 41 : 72
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  for (let y = 0; y < 512; y++) {
    const row = random() * 20
    for (let x = 0; x < 512; x++) {
      const n = kind === 'paper' ? 140 + random() * 85 : 128 + row + random() * 10
      const i = (y * 512 + x) * 4
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = n
      pixels.data[i + 3] = 255
    }
  }
  ctx.putImageData(pixels, 0, 0)
  if (kind === 'steel') {
    for (let i = 0; i < 42; i++) {
      ctx.strokeStyle = `rgba(45,45,45,${random() * 0.12})`
      ctx.lineWidth = 0.3
      const x = random() * 512, y = random() * 512
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 100, y + random() * 2); ctx.stroke()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 4
  return texture
}

function useMaterials() {
  const cotton = useTexture(['/textures/cotton-relief.webp', '/textures/cotton-color.webp'])
  const materials = useMemo(() => {
    const paperNoise = cotton[0].clone()
    const paperColor = cotton[1].clone()
    for (const texture of [paperNoise, paperColor]) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(2.5, 2.5 * 2 / 3.5)
      texture.anisotropy = 8
      texture.needsUpdate = true
    }
    paperColor.colorSpace = THREE.SRGBColorSpace
    const steelNoise = makeTexture('steel')
    return {
      paperNoise, paperColor, steelNoise,
      paper: new THREE.MeshStandardMaterial({ color: '#f1edde', map: paperColor, roughness: 1, bumpMap: paperNoise, bumpScale: 0.045 }),
      paperEdge: new THREE.MeshStandardMaterial({ color: '#cfc7b4', roughness: 1, bumpMap: paperNoise, bumpScale: 0.018 }),
      steel: new THREE.MeshPhysicalMaterial({ color: '#d0d1cd', metalness: 1, roughness: 0.21, roughnessMap: steelNoise, envMapIntensity: 1.35, clearcoat: 0.35, clearcoatRoughness: 0.2, bumpMap: steelNoise, bumpScale: 0.0007 }),
      chrome: new THREE.MeshPhysicalMaterial({ color: '#eceee9', metalness: 1, roughness: 0.11, envMapIntensity: 1.35 }),
      inside: new THREE.MeshPhysicalMaterial({ color: '#bfc0b4', metalness: 1, roughness: 0.25, envMapIntensity: 1.1, bumpMap: steelNoise, bumpScale: 0.001 }),
      seam: new THREE.MeshStandardMaterial({ color: '#454740', metalness: 0.85, roughness: 0.35 }),
    }
  }, [cotton])
  useEffect(() => () => { Object.values(materials).forEach(value => value.dispose()) }, [materials])
  return materials
}

function CaseModel({ phase, lidRef, holderRef, materials, onOpen, onPress, onHover }: {
  phase: Phase
  lidRef: RefObject<THREE.Group | null>
  holderRef: RefObject<THREE.Group | null>
  materials: ReturnType<typeof useMaterials>
  onOpen: () => void
  onPress: (pressed: boolean) => void
  onHover: (hovered: boolean) => void
}) {
  const geometries = useMemo(() => ({
    bottom: makeSlab(CASE_W, CASE_H, 0.09, 0.095, 0.025),
    liner: makeSlab(CASE_W - 0.19, CASE_H - 0.19, 0.022, 0.065, 0.006),
    lid: makeSlab(CASE_W, CASE_H, 0.075, 0.095, 0.024),
    rim: makeRim(CASE_W - 0.045, CASE_H - 0.045, 0.045, 0.13),
    lidRim: makeRim(CASE_W - 0.1, CASE_H - 0.1, 0.025, 0.04),
    catch: makeSlab(0.49, 0.23, 0.06, 0.035, 0.012),
    tabs: makeSlab(0.35, 0.38, 0.025, 0.07, 0.009),
  }), [])
  useEffect(() => () => { Object.values(geometries).forEach(geo => geo.dispose()) }, [geometries])
  return <group ref={holderRef} visible={phase !== 'open'}>
    <mesh geometry={geometries.bottom} material={materials.steel} position={[0, 0, -0.13]} castShadow receiveShadow />
    <mesh geometry={geometries.liner} material={materials.inside} position={[0, 0, -0.071]} />
    <mesh geometry={geometries.rim} material={materials.chrome} position={[0, 0, -0.022]} castShadow />
    {[-1, 1].map(side => <group key={side}>
      <mesh geometry={geometries.tabs} material={materials.chrome} position={[side * 2.6, -1.49, 0.074]} rotation={[0, 0, side * -0.27]} />
      <mesh position={[side * 2.73, 0, -0.05]} material={materials.seam}><boxGeometry args={[0.015, 3.05, 0.012]} /></mesh>
    </group>)}
    <mesh geometry={geometries.catch} material={materials.chrome} position={[0, -CASE_H / 2 - 0.018, 0.007]} rotation={[0.18, 0, 0]} castShadow />
    {[-2.05, -0.72, 0.72, 2.05].map(x => <group key={x} position={[x, CASE_H / 2 - 0.025, -0.006]}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={materials.chrome} castShadow><cylinderGeometry args={[0.063, 0.063, 0.65, 20]} /></mesh>
      <mesh position={[0.285, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.seam}><cylinderGeometry args={[0.064, 0.064, 0.008, 20]} /></mesh>
    </group>)}
    <group ref={lidRef} position={[0, CASE_H / 2 - 0.025, 0.085]}>
      <group position={[0, -CASE_H / 2 + 0.025, 0.04]}>
        <mesh geometry={geometries.lid} material={materials.steel} castShadow receiveShadow />
        <mesh geometry={geometries.liner} material={materials.inside} position={[0, 0, -0.052]} />
        <mesh geometry={geometries.lidRim} material={materials.chrome} position={[0, 0, -0.051]} />
        <mesh position={[0, -CASE_H / 2 + 0.065, 0.04]} material={materials.chrome}><boxGeometry args={[0.43, 0.035, 0.019]} /></mesh>
        {phase === 'closed' && <Html transform distanceFactor={4} position={[0, 0, 0.041]} zIndexRange={[25, 0]} pointerEvents="none" style={{ pointerEvents: 'none' }}>
          <button className="holder-hit-target" aria-label="Open Tai’s card holder" onClick={onOpen}
            onPointerEnter={event => { if (event.pointerType === 'mouse') onHover(true) }}
            onPointerDown={event => { if (event.isPrimary && event.button === 0) onPress(true) }}
            onPointerUp={() => onPress(false)} onPointerLeave={() => { onPress(false); onHover(false) }} onPointerCancel={() => { onPress(false); onHover(false) }}
            onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') onPress(true) }}
            onKeyUp={() => onPress(false)} onBlur={() => onPress(false)} />
        </Html>}
      </group>
    </group>
  </group>
}

const smooth = (t: number) => { const x = THREE.MathUtils.clamp(t, 0, 1); return x * x * (3 - 2 * x) }
const hinge = (t: number) => 1 - Math.exp(-11 * t) * (Math.cos(9 * t) + 11 / 9 * Math.sin(9 * t))

function SceneContent(props: Props) {
  const { phase, back, reduced, pointer, settings, hovered, locked, onOpened, onReady, onNavigate } = props
  const root = useRef<THREE.Group>(null)
  const card = useRef<THREE.Group>(null)
  const holder = useRef<THREE.Group>(null)
  const lid = useRef<THREE.Group>(null)
  const frontHTML = useRef<HTMLDivElement>(null)
  const backHTML = useRef<HTMLDivElement>(null)
  const start = useRef<number | null>(null)
  const complete = useRef(false)
  const turn = useRef(back ? Math.PI : 0)
  const navigationActive = useRef(false)
  const pressed = useRef(false)
  const pressure = useRef(0)
  const releasePose = useRef({ rotation: new THREE.Euler(), x: 0, y: 0, z: 0, scale: 1 })
  const warmFrames = useRef(0)
  const materials = useMaterials()
  const geometry = useMemo(() => makeSlab(CARD_W, CARD_H, 0.052, 0.017, 0.008), [])
  const { camera, size, gl, scene } = useThree()

  useEffect(() => registerCardSnapshot(() => {
    // Render synchronously for the one navigation snapshot without retaining every frame.
    gl.render(scene, camera)
    return gl.domElement.toDataURL('image/png')
  }), [gl, scene, camera])

  useEffect(() => {
    const release = () => { pressed.current = false }
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('blur', release)
    }
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    // Match the CSS card measure while preserving the physical 3.5:2 ratio.
    const width = Math.min(600, size.width * 0.82, (size.height - 180) * 1.75)
    cam.position.z = CARD_W * size.height / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * Math.max(140, width))
    cam.updateProjectionMatrix()
  }, [camera, size])

  useFrame(({ clock }, delta) => {
    if (!root.current || !card.current) return
    if (++warmFrames.current === 3) requestAnimationFrame(onReady)
    const dt = Math.min(delta, 0.05)
    const time = clock.elapsedTime
    // Holo's normalized pointer-follow approach, adapted to real meshes and delta time.
    const px = reduced ? 0 : pointer.current.x
    const py = reduced ? 0 : pointer.current.y
    const inclination = phase === 'open' ? 0.025 : 0.1
    pressure.current = THREE.MathUtils.damp(pressure.current, pressed.current && phase === 'closed' ? 1 : 0, 24, dt)
    const pixelsPerUnit = Math.max(140, Math.min(600, size.width * 0.82, (size.height - 180) * 1.75)) / CARD_W
    if (phase !== 'opening' && !navigationActive.current && !locked.current) {
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, inclination - py * THREE.MathUtils.degToRad(settings.tiltX) + pressure.current * py * 0.018, settings.speed, dt)
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, -0.09 + px * THREE.MathUtils.degToRad(settings.tiltY) - pressure.current * px * 0.018, settings.speed, dt)
      root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, phase === 'open' ? -0.018 : -0.055, 5, dt)
      root.current.position.x = THREE.MathUtils.damp(root.current.position.x, px * settings.travel / pixelsPerUnit, settings.speed, dt)
      root.current.position.y = THREE.MathUtils.damp(root.current.position.y, reduced ? 0 : -py * settings.travel * 0.65 / pixelsPerUnit + Math.sin(time * 0.75) * 0.014, settings.speed, dt)
      root.current.position.z = -pressure.current * 0.085
      const scale = reduced || !hovered ? 1 : 1 + settings.lift / 100
      root.current.scale.setScalar(THREE.MathUtils.damp(root.current.scale.x, scale, 6, dt))
    }
    turn.current = reduced ? (back ? Math.PI : 0) : THREE.MathUtils.damp(turn.current, back ? Math.PI : 0, 7.5, dt)
    card.current.rotation.y = turn.current
    if (phase === 'opening' && holder.current && lid.current) {
      if (start.current === null) {
        start.current = time
        releasePose.current = { rotation: root.current.rotation.clone(), x: root.current.position.x, y: root.current.position.y, z: root.current.position.z, scale: root.current.scale.x }
      }
      const elapsed = reduced ? 2 : time - start.current
      const settle = smooth((elapsed - 0.42) / 0.74)
      const lift = smooth((elapsed - 0.24) / 0.28) * (1 - smooth((elapsed - 0.62) / 0.54))
      const exit = THREE.MathUtils.clamp((elapsed - 0.48) / 0.68, 0, 1)
      const departure = exit * exit * (0.72 + 0.28 * exit)
      const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2)) * camera.position.z
      // The lid opens toward the viewer. The paper clears the tray before its exit.
      lid.current.rotation.x = -hinge(elapsed) * 2.98
      holder.current.rotation.x = Math.sin(Math.min(1, elapsed / 0.55) * Math.PI) * 0.028
      holder.current.rotation.z = -smooth(exit) * 0.065
      holder.current.position.y = -departure * (viewHeight / 2 + CASE_H * 2.1)
      holder.current.position.z = -smooth((elapsed - 0.42) / 0.3) * 0.5 - departure * 1.8
      card.current.position.z = 0.016 + lift * 0.48
      card.current.position.y = lift * 0.045
      const pose = releasePose.current
      root.current.rotation.set(
        THREE.MathUtils.lerp(pose.rotation.x, 0.025, settle),
        THREE.MathUtils.lerp(pose.rotation.y, -0.09, settle),
        THREE.MathUtils.lerp(pose.rotation.z, -0.018, settle),
      )
      root.current.position.y = pose.y * (1 - settle)
      root.current.position.x = pose.x * (1 - settle)
      root.current.position.z = pose.z * (1 - smooth(elapsed / 0.2))
      root.current.scale.setScalar(THREE.MathUtils.lerp(pose.scale, 1, settle))
      root.current.updateWorldMatrix(true, true)
      if (frontHTML.current) frontHTML.current.style.clipPath = lidClipPath(lid.current, card.current, camera, CASE_W, CASE_H)
      if (elapsed >= 1.16 && !complete.current) { complete.current = true; onOpened() }
    }
    const exposed = phase !== 'closed'
    const front = exposed && Math.cos(turn.current) >= 0
    const reverse = exposed && !front
    if (frontHTML.current) {
      frontHTML.current.style.visibility = front ? 'visible' : 'hidden'
      frontHTML.current.inert = !front || phase !== 'open'
      if (phase === 'open') frontHTML.current.style.clipPath = ''
    }
    if (backHTML.current) { backHTML.current.style.visibility = reverse ? 'visible' : 'hidden'; backHTML.current.inert = !reverse }
  })

  return <>
    <ambientLight intensity={1.1} />
    <directionalLight position={[-3, 5, 8]} intensity={1.8} color="#fff9ed" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-far={35} shadow-normalBias={0.025} shadow-bias={-0.0001} shadow-radius={4} />
    <directionalLight position={[3, -2, 3]} intensity={0.4} color="#e2e7f0" />
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#747974']} />
      <Lightformer form="rect" intensity={3.5} color="#fffdf3" position={[-3, 3, 4]} scale={[3.5, 7, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2} color="#d9e1e6" position={[4, 0, 5]} scale={[1.3, 9, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 5, 1]} scale={[10, 0.8, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.06} color="#131a19" position={[0.8, -0.2, 5]} scale={[2.3, 8, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.2} color="#d9d8c7" position={[-2, -4, 2]} scale={[8, 2, 1]} target={[0, 0, 0]} />
    </Environment>
    <group ref={root}>
      <CaseModel phase={phase} holderRef={holder} lidRef={lid} materials={materials} onOpen={props.onOpen} onPress={active => { pressed.current = active }} onHover={props.onSurfaceHover} />
      <group ref={card} position={[0, 0, 0.016]}>
        <mesh geometry={geometry} material={[materials.paper, materials.paperEdge]} castShadow receiveShadow />
        <Html transform pointerEvents="none" distanceFactor={4} position={[0, 0, 0.031]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div ref={frontHTML} className="card-html" style={{ visibility: phase === 'open' ? 'visible' : 'hidden' }}><CardFace onNavigate={onNavigate} onLeave={props.onLeave} onSurfaceHover={props.onSurfaceHover} onInteractionChange={active => { navigationActive.current = active; props.onInteractionChange(active) }} /></div>
        </Html>
        <Html transform pointerEvents="none" distanceFactor={4} position={[0, 0, -0.031]} rotation={[0, Math.PI, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div ref={backHTML} className="card-html" style={{ visibility: 'hidden' }}><CardFace back onSurfaceHover={props.onSurfaceHover} /></div>
        </Html>
      </group>
    </group>
    <mesh position={[0, 0, -1.5]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <shadowMaterial transparent opacity={0.12} color="#30423a" depthWrite={false} />
    </mesh>
    <ContactShadows position={[0, -2.1, 0]} opacity={0.29} scale={12} blur={3.2} far={6} resolution={256} color="#363c38" frames={reduced ? 1 : Infinity} />
  </>
}

export default function BusinessScene(props: Props) {
  const [contextLost, setContextLost] = useState(() => {
    // Canvas initializes its renderer asynchronously, outside the React boundary.
    // Check support here so unavailable WebGL reaches the HTML fallback.
    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('webgl2')
      if (!context) return true
      context.getExtension('WEBGL_lose_context')?.loseContext()
      return false
    } catch { return true }
  })
  if (contextLost) throw new Error('WebGL context unavailable')
  return <Canvas
    shadows="percentage"
    camera={{ position: [0, 0, 11.6], fov: 35, near: 0.1, far: 80 }}
    dpr={[1, 1.5]}
    gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
    onCreated={({ gl }) => {
      gl.setClearColor('#fafaf8', 0)
      gl.domElement.setAttribute('aria-hidden', 'true')
      gl.domElement.addEventListener('webglcontextlost', () => setContextLost(true), { once: true })
    }}
  ><SceneContent {...props} /></Canvas>
}
