import { useEffect, useRef, useState } from 'react'
import { defaultMotion, motionControls } from '../motion'
import type { MotionSettings, MotionSurface } from '../motion'

export default function MotionPalette({ surface, settings, onChange, onReplay }: { surface: MotionSurface; settings: MotionSettings; onChange: (settings: MotionSettings) => void; onReplay: () => void }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const previousFocus = useRef<HTMLElement | null>(null)
  const close = () => { setOpen(false); previousFocus.current?.focus({ preventScroll: true }) }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (open) close()
        else { previousFocus.current = document.activeElement as HTMLElement; setOpen(true) }
      }
      if (event.key === 'Escape' && open) close()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open])

  if (!open) return null
  return <aside className="motion-tools" aria-label="Local preview controls" data-motion-controls>
    <section className="motion-palette" id="motion-palette" aria-label="Motion settings">
      <header><span>{surface === 'holder' ? 'Holder motion' : 'Card motion'} <small>LOCAL PREVIEW</small></span><button aria-label="Close motion settings" onClick={close}>×</button></header>
      <div className="motion-sliders">{motionControls.map(control => <label key={control.key}>
        <span>{control.label}<output>{settings[control.key]}{control.unit}</output></span>
        <input aria-label={control.label} type="range" min={control.min} max={control.max} step={control.step} value={settings[control.key]} onChange={event => onChange({ ...settings, [control.key]: Number(event.target.value) })} />
      </label>)}</div>
      <footer><button onClick={() => onChange({ ...defaultMotion[surface] })}>Reset</button><button onClick={async () => {
        try { await navigator.clipboard.writeText(JSON.stringify(settings, null, 2)); setCopied(true); window.setTimeout(() => setCopied(false), 1500) } catch { setCopied(false) }
      }}>{copied ? 'Copied' : 'Copy settings'}</button><button onClick={onReplay}>Replay entrance</button></footer>
    </section>
  </aside>
}
