import { profile } from '../profile'
import { loadIndex } from '../routeModules'

export function CardFace({ back = false, onNavigate, onInteractionChange, onSurfaceHover, onLeave }: { back?: boolean; onNavigate?: (path: string) => void; onInteractionChange?: (active: boolean) => void; onSurfaceHover?: (active: boolean) => void; onLeave?: () => void }) {
  return <div className={`card-face ${back ? 'card-face--back' : ''}`} data-cursor="card" onPointerEnter={event => { if (event.pointerType === 'mouse') onSurfaceHover?.(true) }} onPointerLeave={() => onSurfaceHover?.(false)}>
    {back ? <>
      <div className="card-back-heading">About</div>
      <p className="card-bio">{profile.bio}</p>
    </> : <>
      <div className="card-topline" onPointerEnter={() => { onInteractionChange?.(true); void loadIndex() }} onPointerLeave={() => onInteractionChange?.(false)} onFocusCapture={() => { onInteractionChange?.(true); void loadIndex() }} onBlurCapture={() => onInteractionChange?.(false)}>
        <a href={`mailto:${profile.email}`} className="card-email" onClick={onLeave}>Email</a>
        <nav className="card-nav" aria-label="Portfolio">
          {['Work', 'Projects'].map((label, index) => <span key={label}>
            {index > 0 && <span className="card-divider" aria-hidden="true">|</span>}
            <a href={`/index#${label.toLowerCase()}`} onClick={event => {
              onLeave?.()
              if (onNavigate && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                event.preventDefault()
                onNavigate(`/index#${label.toLowerCase()}`)
              }
            }}>{label}</a>
          </span>)}
        </nav>
      </div>
      <div className="card-identity"><h1><span>Tai Shan</span> Lin</h1><p>{profile.title}</p></div>
      <div className="card-location">{profile.location}</div>
    </>}
  </div>
}
