import * as THREE from 'three'

const FACE_Z = 0.031
const corners = [-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => new THREE.Vector3(x, y, z))))
const edges = corners.flatMap((a, i) => corners.flatMap((b, j) => i < j && a.distanceToSquared(b) === 4 ? [[i, j]] : []))
type Point = { x: number; y: number }
const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)

// Project the solid lid onto the card's HTML plane. This keeps the actual type
// attached to the paper as the lid reveals it, including partial lines of text.
export function lidClipPath(lid: THREE.Group, card: THREE.Group, camera: THREE.Camera, width: number, height: number) {
  const inverse = card.matrixWorld.clone().invert()
  const transform = inverse.clone().multiply(lid.matrixWorld)
  const eye = camera.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse)
  const vertices = corners.map(p => new THREE.Vector3(
    p.x * width / 2,
    -height / 2 + 0.025 + p.y * height / 2,
    0.04 + p.z * 0.04,
  ).applyMatrix4(transform))
  const visible = vertices.filter(p => p.z >= FACE_Z)
  for (const [a, b] of edges) {
    const start = vertices[a], end = vertices[b]
    if ((start.z >= FACE_Z) !== (end.z >= FACE_Z)) {
      visible.push(start.clone().lerp(end, (FACE_Z - start.z) / (end.z - start.z)))
    }
  }
  if (visible.length < 3) return ''
  const points = visible.map(p => {
    const t = (FACE_Z - eye.z) / (p.z - eye.z)
    return { x: 270 + (eye.x + (p.x - eye.x) * t) * 100, y: 540 / 3.5 - (eye.y + (p.y - eye.y) * t) * 100 }
  }).sort((a, b) => a.x - b.x || a.y - b.y)
  const half = (list: Point[]) => {
    const hull: Point[] = []
    for (const p of list) {
      while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0) hull.pop()
      hull.push(p)
    }
    return hull.slice(0, -1)
  }
  const hull = [...half(points), ...half([...points].reverse())]
  const hole = hull.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ')
  return `path(evenodd, "M 0 0 H 540 V ${540 / 1.75} H 0 Z M ${hole} Z")`
}
