import type { Study } from '../content'

export function SystemFigure({ type }: { type: NonNullable<Study['figure']> }) {
  return <figure className={`system-figure system-figure--${type}`}>
    <div className="figure-caption-top"><span>HighFi</span><span>System overview</span></div>
    {type === 'snapshots' && <div className="figure-layout">
      <div className="source-stack"><span>Loan data</span><span>Cash balances</span><span>Servicing</span><span>Rates</span></div>
      <span className="diagram-connector" aria-hidden="true" />
      <div className="snapshot-stack"><div /><div /><div className="snapshot-top"><span className="diagram-dot" /><strong>Verified snapshot</strong><span>Inputs + timestamp + lineage</span></div></div>
      <span className="diagram-connector" aria-hidden="true" />
      <div className="report-sheet"><span className="sheet-fold" /><span className="report-label">Compliance</span><i /><i /><i /><span className="report-foot">Reproducible by design</span></div>
    </div>}
    {type === 'agreements' && <div className="figure-layout">
      <div className="legal-sheet"><span>Credit agreement</span><i /><i /><i /><i /><i /><div className="legal-signature">Terms & conditions</div></div>
      <span className="diagram-connector" aria-hidden="true" />
      <div className="recipe-sheet"><span className="recipe-heading">Facility model</span><p><span>Rule</span> Concentration limit</p><p><span>Input</span> Collateral pool</p><p><span>Action</span> Calculate + verify</p><div className="review-stamp">Human reviewed <span>✓</span></div></div>
    </div>}
    {type === 'millie' && <div className="millie-diagram">
      <div className="request-note"><div className="request-avatar">m</div><div><strong>Millie</strong><p>A question. The right context.</p></div></div>
      <div className="policy-boundary"><div className="boundary-label">Explicit workflow boundary</div><div className="policy-steps"><span>Identity</span><b>→</b><span>Scope</span><b>→</b><span>Permission</span></div><div className="policy-result"><span className="diagram-dot" /> HighFi workflow <span className="approval-label">Approval where required</span></div></div>
    </div>}
    <figcaption>{type === 'snapshots' ? 'Capture the inputs. Preserve the history. Explain the result.' : type === 'agreements' ? 'Agreement-specific complexity becomes reviewed configuration.' : 'Slack is the interface. HighFi is the source of truth.'}</figcaption>
  </figure>
}
