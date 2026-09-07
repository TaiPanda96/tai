import { useState } from 'react'

export const isLocalPreview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
export const motionControls = [
  { key: 'tiltX', label: 'Vertical tilt', min: 0, max: 24, step: 1, unit: '°' },
  { key: 'tiltY', label: 'Horizontal tilt', min: 0, max: 28, step: 1, unit: '°' },
  { key: 'travel', label: 'Movement', min: 0, max: 32, step: 1, unit: 'px' },
  { key: 'speed', label: 'Follow speed', min: 2, max: 12, step: 0.5, unit: '' },
  { key: 'background', label: 'Background depth', min: 0, max: 32, step: 1, unit: 'px' },
  { key: 'lift', label: 'Hover lift', min: 0, max: 8, step: 0.5, unit: '%' },
] as const
export type MotionSettings = Record<typeof motionControls[number]['key'], number>
export type MotionSurface = 'holder' | 'card'
export type MotionProfiles = Record<MotionSurface, MotionSettings>
export const defaultMotion: MotionProfiles = {
  holder: { tiltX: 15, tiltY: 17, travel: 10, speed: 7, background: 24, lift: 5.5 },
  card: { tiltX: 2, tiltY: 2, travel: 3, speed: 3, background: 17, lift: 8 },
}
// The previous shared settings must not override the two approved profiles.
const KEY = 'tai:motion:v2'

function readSettings(): MotionProfiles {
  if (!isLocalPreview) return defaultMotion
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
    return Object.fromEntries((['holder', 'card'] as const).map(surface => [surface,
      Object.fromEntries(motionControls.map(({ key, min, max }) => [key, Number.isFinite(saved[surface]?.[key]) ? Math.max(min, Math.min(max, saved[surface][key])) : defaultMotion[surface][key]])),
    ])) as MotionProfiles
  } catch { return defaultMotion }
}

export function useMotionSettings() {
  const [settings, setSettings] = useState(readSettings)
  const update = (next: MotionProfiles) => {
    setSettings(next)
    if (isLocalPreview) { try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* The controls still work without persistence. */ } }
  }
  return [settings, update] as const
}
