import { Link, useNavigate } from 'react-router-dom'
import { navigateWithCard } from '../cardTransition'
import { Arrow } from './Icons'

export function CardReturn() {
  const navigate = useNavigate()
  return <Link className="card-return" to="/" aria-label="Back to card" title="Back to card" onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigateWithCard(navigate, '/')
  }}><Arrow /><span className="card-mark" data-card-anchor aria-hidden="true"><i /><i /><i /><i /></span></Link>
}
