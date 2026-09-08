import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { studies, studyPath, workHistory } from '../content'
import { CardReturn } from '../components/CardReturn'
import { loadStudy } from '../routeModules'

export function IndexPage() {
  const [emphasis, setEmphasis] = useState<string | null>(null)
  const { hash } = useLocation()
  useEffect(() => { document.title = 'Work & Projects - Tai Shan Lin' }, [])

  return <div className="editorial-layout index-layout" data-emphasis={emphasis ?? undefined}>
    <aside className="editorial-rail"><nav aria-label="Breadcrumb"><CardReturn /></nav></aside>
    <main className="index-main">
      <h1 className="sr-only" tabIndex={-1}>Work and Projects</h1>
      {(['work', 'projects'] as const).map(category => {
        const entries = studies.filter(study => study.category === category)
        const companies = [...new Set(entries.map(study => study.company))]
        const title = category === 'work' ? 'Work' : 'Projects'
        return <section id={category} className="index-section" data-category={category} key={category}>
          <h2 tabIndex={-1}><Link to={`/index#${category}`} aria-current={hash === `#${category}` ? 'location' : undefined}
            onPointerEnter={() => setEmphasis(category)} onPointerLeave={() => setEmphasis(null)}
            onFocus={() => setEmphasis(category)} onBlur={() => setEmphasis(null)}>{title}</Link></h2>
          {entries.length ? <table className="experience-table" aria-label={title}>
            {companies.map(company => <tbody key={company}>
              {entries.filter(study => study.company === company).map((study, index, group) => <tr key={study.slug}>
                {index === 0 && <th scope="rowgroup" rowSpan={group.length}>
                  <span className="experience-company">{company}</span>
                  {category === 'work' && workHistory[company] && <span className="experience-period">{workHistory[company].years}</span>}
                </th>}
                <td><Link className="entry-link" to={studyPath(study)} onPointerEnter={() => { void loadStudy() }} onFocus={() => { void loadStudy() }}>{study.shortTitle}</Link></td>
              </tr>)}
            </tbody>)}
          </table> : <p className="empty-projects">No projects added yet.</p>}
        </section>
      })}
    </main>
  </div>
}
