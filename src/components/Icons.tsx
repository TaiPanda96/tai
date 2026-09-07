import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>
export function Arrow({ direction = 'left', ...props }: Props & { direction?: 'left' | 'right' }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <g transform={direction === 'right' ? 'rotate(180 12 12)' : undefined}>
      <path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
}

export function FlipIcon(props: Props) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M7 5.5h10a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.2" />
    <path d="M20.5 9c1 .7 1.5 1.5 1.5 2.4 0 2.2-4.5 4-10 4s-10-1.8-10-4c0-.9.5-1.7 1.5-2.4M18 12l2 2.4-2.8 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

export function Plus(props: Props) {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}><path d="M4 10h12M10 4v12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
}

export function SoundIcon({ enabled, ...props }: Props & { enabled: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M4 9h4l5-4v14l-5-4H4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    {enabled ? <path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /> : <path d="m17 9 5 6m0-6-5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
  </svg>
}
