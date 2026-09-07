import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { studies, studyPath, workHistory } from '../content'
import { Arrow, Plus } from '../components/Icons'
import { CardReturn } from '../components/CardReturn'
import { SystemFigure } from '../components/SystemFigure'

export function CaseStudy() {
  const { slug } = useParams()
  const { pathname } = useLocation()
  const category = pathname.startsWith('/projects/') ? 'projects' : 'work'
  const siblings = studies.filter(item => item.category === category)
  const studyIndex = siblings.findIndex(item => item.slug === slug)
  const study = siblings[studyIndex]
  const [activeSection, setActiveSection] = useState('')
  const [tocOpen, setTocOpen] = useState(false)
  useEffect(() => {
    if (!study) return
    document.title = `${study.shortTitle} - Tai Shan Lin`
    setTocOpen(false)
    setActiveSection('')
    if (study.sections.length < 2) return
    let frame = 0
    const update = () => {
      let current = study.sections[0].id
      for (const section of study.sections) {
        if ((document.getElementById(section.id)?.getBoundingClientRect().top ?? Infinity) <= 140) current = section.id
      }
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        current = study.sections[study.sections.length - 1].id
      }
      setActiveSection(current)
      frame = 0
    }
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    frame = requestAnimationFrame(update)
    window.addEventListener('scroll', scroll, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll) }
  }, [study])
  if (!study) return <Navigate replace to={`/index#${category}`} />
  const previous = siblings[studyIndex - 1]
  const next = siblings[studyIndex + 1]
  const experience = category === 'work' ? workHistory[study.company] : undefined
  const hasContents = study.sections.length > 1
  return <div className="editorial-layout study-layout">
    <aside className="editorial-rail">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <CardReturn /><span className="breadcrumb-divider" aria-hidden="true">/</span><Link to={`/index#${category}`}>Index</Link>
        <span className="sr-only" aria-current="page">{study.shortTitle}</span>
      </nav>
      {hasContents && <>
        <button className="mobile-toc-button" onClick={() => setTocOpen(value => !value)} aria-expanded={tocOpen} aria-controls="study-contents">On this page<Plus /></button>
        <nav id="study-contents" className={`study-contents ${tocOpen ? 'is-open' : ''}`} aria-label="On this page">
          {study.sections.map(section => <Link key={section.id} className={activeSection === section.id ? 'is-current' : ''} to={`${studyPath(study)}#${section.id}`} onClick={() => setTocOpen(false)} aria-current={activeSection === section.id ? 'location' : undefined}>{section.title}</Link>)}
        </nav>
      </>}
    </aside>
    <main className="study-main">
      <article>
        <header className="study-header">
          <h1 tabIndex={-1}>{study.title}</h1>
          <p className="study-meta">{study.company}{experience && <> · {experience.role}</>}</p>
          {experience && <p className="study-period">{experience.period}</p>}
          <p className="study-introduction">{study.introduction}</p>
        </header>
        {study.sections.map((section, index) => <section id={section.id} className="study-section" key={section.id}>
          <h2 tabIndex={-1}>{section.title}</h2>
          {section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          {index === 1 && study.figure && <SystemFigure type={study.figure} />}
          {section.quote && <blockquote>{section.quote}</blockquote>}
          {section.flow && <ol className="inline-flow" aria-label="Workflow">{section.flow.map(step => <li key={step}>{step}</li>)}</ol>}
        </section>)}
      </article>
      <nav className="study-pagination" aria-label={category === 'work' ? 'Work entries' : 'Projects'}>
        {previous && <Link className="pagination-prev" to={studyPath(previous)}><Arrow /><span><small>Previous</small>{previous.shortTitle}</span></Link>}
        {next && <Link className="pagination-next" to={studyPath(next)}><span><small>Next</small>{next.shortTitle}</span><Arrow direction="right" /></Link>}
      </nav>
    </main>
  </div>
}
