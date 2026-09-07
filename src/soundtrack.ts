import { useSyncExternalStore } from 'react'

type Cue = 'opening' | 'reaction'
type Track = { audio: HTMLAudioElement; gain?: GainNode; timer?: number; generation: number }
const keys = { enabled: 'tai:sound-enabled:v1', opening: 'tai:sound-opening:v1', reaction: 'tai:sound-reaction:v1' }
const read = (key: string) => { try { return sessionStorage.getItem(key) } catch { return null } }
const write = (key: string, value: string) => { try { sessionStorage.setItem(key, value) } catch { /* Keep the in-memory preference. */ } }

class Soundtrack {
  private enabled = read(keys.enabled) !== 'false'
  private listeners = new Set<() => void>()
  private tracks: Partial<Record<Cue, Track>> = {}
  private context?: AudioContext
  private eligible = false
  private exposed = false
  private reactionTimer?: number
  private used = { opening: read(keys.opening) === 'true', reaction: read(keys.reaction) === 'true' }

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  snapshot = () => this.enabled

  beginVisit(firstVisit: boolean) { this.eligible = firstVisit; this.exposed = false }

  prepare = () => {
    if (!this.eligible || !this.enabled) return
    for (const cue of ['opening', 'reaction'] as const) {
      if (this.tracks[cue]) continue
      const audio = document.createElement('audio')
      audio.src = cue === 'opening' ? '/audio/card-open.m4a' : '/audio/card-reaction.m4a'
      audio.preload = 'auto'
      audio.dataset.cue = cue
      audio.hidden = true
      if (cue === 'opening') audio.addEventListener('ended', () => this.queueReaction())
      document.body.append(audio)
      this.tracks[cue] = { audio, generation: 0 }
    }
  }

  // Resume and play are called directly from a click/tap, including on Safari.
  unlock = () => {
    if (!this.eligible || !this.enabled) return
    this.prepare()
    if (!this.context) this.context = new AudioContext()
    for (const track of Object.values(this.tracks)) {
      if (track.gain) continue
      track.gain = this.context.createGain()
      this.context.createMediaElementSource(track.audio).connect(track.gain).connect(this.context.destination)
    }
    void this.context.resume().then(() => this.queueReaction()).catch(() => {})
  }

  private play(cue: Cue) {
    const track = this.tracks[cue]
    if (!this.enabled || !this.eligible || this.used[cue] || !track || !this.context || !track.gain) return
    clearTimeout(track.timer)
    const generation = ++track.generation
    track.audio.currentTime = 0
    track.gain.gain.cancelScheduledValues(this.context.currentTime)
    track.gain.gain.setValueAtTime(cue === 'opening' ? 0.8 : 0.68, this.context.currentTime)
    this.used[cue] = true
    write(keys[cue], 'true')
    void track.audio.play().catch(error => {
      if (generation !== track.generation) return
      if (error.name === 'NotAllowedError') {
        this.used[cue] = false
        write(keys[cue], 'false')
      }
    })
  }

  open = () => { this.unlock(); this.play('opening') }

  reveal = () => {
    this.exposed = true
    this.queueReaction()
  }

  private queueReaction() {
    if (!this.exposed || !this.enabled || !this.eligible || this.used.reaction || this.context?.state !== 'running') return
    clearTimeout(this.reactionTimer)
    const opening = this.tracks.opening?.audio
    // Wait for actual completion, including when the opening clip downloads slowly.
    if (opening && !opening.paused && !opening.ended) return
    this.reactionTimer = window.setTimeout(() => this.play('reaction'), 100)
  }

  private fade(cue: Cue) {
    const track = this.tracks[cue]
    if (!track) return
    const generation = ++track.generation
    clearTimeout(track.timer)
    if (this.context && track.gain) {
      const gain = track.gain.gain
      gain.cancelAndHoldAtTime(this.context.currentTime)
      gain.linearRampToValueAtTime(0, this.context.currentTime + 0.35)
    }
    track.timer = window.setTimeout(() => {
      if (generation === track.generation) track.audio.pause()
    }, 360)
  }

  fadeAll = () => { this.exposed = false; clearTimeout(this.reactionTimer); this.fade('opening'); this.fade('reaction') }
  leaveVisit = () => { this.eligible = false; this.fadeAll() }

  toggle = () => {
    this.enabled = !this.enabled
    write(keys.enabled, String(this.enabled))
    if (!this.enabled) this.fadeAll()
    else this.unlock()
    this.listeners.forEach(listener => listener())
  }

  replay = () => {
    this.fadeAll()
    this.used = { opening: false, reaction: false }
    this.exposed = false
    write(keys.opening, 'false'); write(keys.reaction, 'false')
    this.eligible = true
    this.unlock()
  }
}

export const soundtrack = new Soundtrack()
export const useSoundEnabled = () => useSyncExternalStore(soundtrack.subscribe, soundtrack.snapshot)
document.addEventListener('visibilitychange', () => { if (document.hidden) soundtrack.fadeAll() })
