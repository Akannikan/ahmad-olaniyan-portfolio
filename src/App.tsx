import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import emailjs from '@emailjs/browser'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import {
  ArrowDown, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Asterisk, BookOpen,
  Check, Code2, Database, Download, ExternalLink, Facebook, Github, Layers3, Linkedin,
  Mail, Menu, MessageCircle, Moon, MousePointer2, Music2, Send, Server, Sparkles, Sun, UserRound, Users, X,
} from 'lucide-react'
import AdminPage from './admin'
import FilesPage from './FilesPage'
import type { Project } from './data'
import { usePortfolio } from './portfolio'

function PageMeta({ title, description }: { title: string; description: string }) {
  return <Helmet>
    <title>{title} — Ahmad Olaniyan</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={`${title} — Ahmad Olaniyan`} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
  </Helmet>
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' || (url.protocol === 'mailto:' && url.pathname.includes('@')) ? url.href : ''
  } catch {
    return ''
  }
}

function ThemeToggle({ theme, onToggle }: { theme: string; onToggle: () => void }) {
  return (
    <button className="theme-toggle icon-button" onClick={onToggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

function Header({ theme, onToggle }: { theme: string; onToggle: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setMenuOpen(false), [location.pathname])
  const nav = [['Home', '/'], ['About', '/about'], ['Projects', '/projects'], ['Gallery', '/gallery'], ['Files', '/files'], ['Skills', '/skills'], ['Experience', '/experience'], ['Contact', '/contact']]
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link to="/" className="brand" aria-label="Ahmad Olaniyan home">
          <span className="brand-mark">AO<span>.</span></span>
          <span className="brand-name">AHMAD OLANIYAN</span>
        </Link>
        <nav id="main-navigation" className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {nav.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {label}
            </NavLink>
          ))}
          <div className="mobile-nav-tools"><ThemeToggle theme={theme} onToggle={onToggle} /><Link to="/contact" className="button button-small">Let&apos;s talk <ArrowUpRight size={14} /></Link></div>
        </nav>
        <div className="nav-actions">
          <ThemeToggle theme={theme} onToggle={onToggle} />
          <Link to="/contact" className="button button-small nav-cta">Let&apos;s talk <ArrowUpRight size={14} /></Link>
          <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="main-navigation">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const { content } = usePortfolio()
  const socialLinks = content.socialLinks.map(link => link.label === 'Email' && !link.href && content.contactEmail
    ? { ...link, href: `mailto:${content.contactEmail}` }
    : link)
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div><span className="eyebrow"><span className="status-dot" /> OPEN TO MEANINGFUL WORK</span><h2>Have an idea?<br /><span>Let&apos;s make it real.</span></h2></div>
        <Link to="/contact" className="round-link" aria-label="Contact Ahmad"><ArrowUpRight size={24} /></Link>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Ahmad Olaniyan</span>
        <span>Made with intention <Asterisk size={13} /></span>
        <div className="footer-links">
          {socialLinks.map(link => {
            const href = safeExternalUrl(link.href)
            const Icon = socialIcon(link.label)
            return href && <a key={link.label} className="social-link footer-social-link" href={href} aria-label={link.label} target="_blank" rel="noreferrer"><Icon size={17} /></a>
          })}
          <Link to="/files">Files &amp; Documents</Link>
          <Link to="/admin">Dashboard</Link>
        </div>
      </div>
    </footer>
  )
}

function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 560)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return <AnimatePresence>{visible && <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="back-top icon-button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowRight size={18} /></motion.button>}</AnimatePresence>
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion()
  return <motion.div className={className} initial={reduceMotion ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.16 }} transition={{ duration: reduceMotion ? 0 : 0.55, delay, ease: [0.2, 0.75, 0.2, 1] }}>{children}</motion.div>
}

function SectionHeading({ index, title, note }: { index: string; title: string; note?: string }) {
  return <div className="section-heading"><span className="section-index">{index} / 06</span><h2>{title}</h2>{note && <p>{note}</p>}</div>
}

async function downloadCv(content: ReturnType<typeof usePortfolio>['content']) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const left = 18
  const right = pageWidth - 18
  let y = 22
  pdf.setFillColor(16, 19, 16)
  pdf.rect(0, 0, pageWidth, 57, 'F')
  pdf.setTextColor(244, 245, 239)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(23)
  pdf.text('AHMAD OLANIYAN', left, 25)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(198, 255, 107)
  pdf.text(content.professionalRoles.join('  /  '), left, 35, { maxWidth: pageWidth - 75 })
  pdf.setTextColor(211, 214, 207)
  if (content.contactEmail) pdf.text(content.contactEmail, left, 45)

  if (content.portraitUrl) {
    try {
      const response = await fetch(content.portraitUrl)
      if (!response.ok) throw new Error(`Image request failed with status ${response.status}`)
      const blob = await response.blob()
      const bitmap = await createImageBitmap(blob)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Could not prepare the profile image for the CV.')
      context.drawImage(bitmap, 0, 0)
      bitmap.close()
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', right - 35, 10, 30, 37, undefined, 'FAST')
    } catch (error) {
      console.error('Could not include the profile image in the CV PDF:', error)
      window.alert('The CV was not downloaded because the uploaded profile image could not be loaded. Please check the image and try again.')
      return
    }
  }

  const addSection = (heading: string, lines: string[]) => {
    if (!lines.length) return
    if (y > 252) { pdf.addPage(); y = 20 }
    y += 7
    pdf.setTextColor(93, 121, 42)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text(heading.toUpperCase(), left, y)
    y += 5
    pdf.setDrawColor(220, 224, 214)
    pdf.line(left, y, right, y)
    y += 7
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(60, 63, 60)
    for (const text of lines) {
      const wrapped = pdf.splitTextToSize(text, right - left)
      for (const line of wrapped) {
        if (y > 278) { pdf.addPage(); y = 20 }
        pdf.text(line, left, y)
        y += 5
      }
      y += 2
    }
  }

  y = 69
  addSection('Profile', [content.bio])
  addSection('Experience & education', content.timeline.map(item => `${item.title} — ${item.organisation} (${item.date})\n${item.description}`))
  addSection('Skills', content.skills.map(skill => `${skill.title}: ${skill.items.join(', ')}`))
  addSection('Selected projects', content.projects.map(project => `${project.name} — ${project.description}`))
  pdf.save('Ahmad-Olaniyan-CV.pdf')
}

function socialIcon(label: string) {
  const icons = { LinkedIn: Linkedin, GitHub: Github, Email: Mail, WhatsApp: MessageCircle, Facebook, TikTok: Music2 }
  return icons[label as keyof typeof icons] ?? MessageCircle
}

function SocialRow() {
  const { content } = usePortfolio()
  const socialLinks = content.socialLinks.map(link => link.label === 'Email' && !link.href && content.contactEmail
    ? { ...link, href: `mailto:${content.contactEmail}` }
    : link)
  return <div className="social-row">
    {socialLinks.map(link => {
      const Icon = socialIcon(link.label)
      const href = safeExternalUrl(link.href)
      return href ? <a key={link.label} href={href} className="social-link" aria-label={link.label} title={link.label} target="_blank" rel="noreferrer"><Icon size={19} /></a> : <span key={link.label} className="social-link is-placeholder" title={`Add your ${link.label} URL`} aria-label={`${link.label} link not configured`}><Icon size={19} /></span>
    })}
  </div>
}

function Hero() {
  const { content } = usePortfolio()
  const supportingRoles = content.professionalRoles.filter(role => role.toLowerCase() !== 'software engineer')
  const [portraitFlipped, setPortraitFlipped] = useState(false)
  const portraitImages = (content.portraitUrls?.length ? content.portraitUrls : content.portraitUrl ? [content.portraitUrl] : []).slice(0, 3)
  const [portraitIndex, setPortraitIndex] = useState(0)
  const reduceMotion = useReducedMotion()
  useEffect(() => {
    if (portraitImages.length < 2) {
      setPortraitIndex(0)
      return
    }
    const interval = window.setInterval(() => {
      setPortraitFlipped(false)
      setPortraitIndex(index => (index + 1) % portraitImages.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [portraitImages.length])
  return (
    <section className="hero">
      <div className="hero-grid" />
      <div className="hero-glow" />
      <div className="hero-content">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="hero-kicker"><span className="status-dot" /> SOFTWARE ENGINEER <span className="kicker-line" /> BUILDING FOR PEOPLE</motion.div>
        <motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08 }} className="hero-title hero-name">Olaniyan Ahmad</motion.h1>
        <p className="hero-manifesto">Ideas into <span className="outlined-word">impact.</span></p>
        <div className="hero-art" aria-label={portraitImages.length ? 'Ahmad Olaniyan portrait slideshow' : 'Abstract portrait placeholder'}>
          <div className="portrait-frame">{portraitImages.length ? <AnimatePresence initial={false}><motion.div key={portraitImages[portraitIndex]} className="portrait-carousel-slide" initial={{ opacity: 0, scale: 1.025 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.015 }} transition={{ duration: reduceMotion ? 0 : 1.1, ease: 'easeInOut' }}><button className={`portrait-flip-card ${portraitFlipped ? 'is-flipped' : ''}`} type="button" onClick={() => setPortraitFlipped(value => !value)} aria-label={portraitFlipped ? 'Show profile photo' : 'Flip profile photo'} aria-pressed={portraitFlipped}><img className="portrait-photo" src={portraitImages[portraitIndex]} alt={`Ahmad Olaniyan portrait ${portraitIndex + 1}`} /><span className="portrait-back"><strong>Olaniyan Ahmad</strong><span>Software Engineer</span><small>Tap to flip back</small></span></button></motion.div></AnimatePresence> : <><div className="portrait-orbit orbit-one" /><div className="portrait-orbit orbit-two" /><div className="portrait-abstract"><div className="portrait-sun" /><div className="portrait-silhouette"><span className="portrait-head" /><span className="portrait-body" /></div><span className="portrait-stamp">AO<br /><small>SOFTWARE<br />ENGINEER</small></span></div></>}</div>
          <span className="art-index">FIG. 001 <span>— SELF-PORTRAIT IN PROGRESS</span></span>
          <span className="art-spark"><Asterisk size={22} /></span>
        </div>
        <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="hero-role">
          <strong className="role-value">Software Engineer</strong>
          {supportingRoles.length > 0 && <span className="role-supporting">Also: {supportingRoles.join(' · ')}</span>}
        </motion.div>
        <motion.p initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="hero-copy">{content.bio}</motion.p>
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }} className="hero-actions">
          <Link to="/projects" className="button button-primary">Explore my work <ArrowDownRight size={17} /></Link>
          <div className="hero-cv-links">
            <button className="button button-quiet" onClick={() => void downloadCv(content)}>Download CV <Download size={15} /></button>
            {content.cvUrl && <a className="button button-quiet" href={content.cvUrl} target="_blank" rel="noreferrer">Original CV <ExternalLink size={14} /></a>}
          </div>
        </motion.div>
        <SocialRow />
      </div>
      <div className="hero-side-note"><span>01 — 06</span><span className="side-note-line" /><span>SCROLL TO EXPLORE</span></div>
      <a href="#intro" className="scroll-cue" aria-label="Scroll to introduction"><MousePointer2 size={15} /><span>SCROLL</span><ArrowDown size={14} /></a>
      <div className="hero-bottom-label"><span>SOFTWARE ENGINEERING</span><span>KNOWLEDGE SYSTEMS</span><span>ENTREPRENEURSHIP</span></div>
    </section>
  )
}

function ProjectVisual({ tone, number, name, imageUrl }: { tone: string; number: string; name: string; imageUrl?: string }) {
  return <div className={`project-visual ${tone}`}>
    <div className="visual-grid" />
    <span className="visual-number">{number} / 03</span>
    {imageUrl ? <img className="project-photo" src={imageUrl} alt={`${name} project`} loading="lazy" /> : <div className="visual-object">
      {tone === 'lime' ? <><div className="book-stack"><span /><span /><span /></div><BookOpen size={58} strokeWidth={0.85} /></> : tone === 'blue' ? <><div className="route-line" /><div className="route-dot dot-a" /><div className="route-dot dot-b" /><div className="route-dot dot-c" /><Layers3 size={55} strokeWidth={0.8} /></> : <><div className="dynamo-ring ring-one" /><div className="dynamo-ring ring-two" /><Asterisk size={78} strokeWidth={0.8} /></>}
    </div>}
    <span className="visual-caption">{name.toUpperCase()}</span>
    <ArrowUpRight className="visual-arrow" size={18} />
  </div>
}

function ProjectCard({ project, compact = false }: { project: Project; compact?: boolean }) {
  return <Link to={`/projects/${project.slug}`} className={`project-card ${compact ? 'compact' : ''}`}>
    <ProjectVisual tone={project.tone} number={project.number} name={project.name} imageUrl={project.imageUrl} />
    <div className="project-card-content">
      <div className="project-card-top"><span className="project-category">{project.category}</span><span className="project-number">0{project.number}</span></div>
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <div className="project-card-bottom"><div className="tag-row">{project.technologies.slice(0, 2).map(tag => <span className="tag" key={tag}>{tag}</span>)}</div><span className="text-link">View project <ArrowUpRight size={14} /></span></div>
    </div>
  </Link>
}

function ProjectSection({ home = false }: { home?: boolean }) {
  const { content } = usePortfolio()
  const [activeFilter, setActiveFilter] = useState('All projects')
  const categories = ['All projects', 'Web Development', 'Library Technology', 'Business / Entrepreneurship']
  const visible = home ? content.projects : content.projects.filter(project => activeFilter === 'All projects' || project.category === activeFilter)
  return <section className="section projects-section" id="projects">
    <div className="container"><SectionHeading index="03" title={home ? 'Selected work' : 'Projects & experiments'} note="A few ideas taking shape across technology, knowledge, and business." />
      {!home && <div className="filter-row" aria-label="Filter projects">{categories.map(category => <button key={category} className={`filter-button ${activeFilter === category ? 'active' : ''}`} onClick={() => setActiveFilter(category)}>{category}</button>)}</div>}
      <motion.div layout className="projects-grid">{visible.map((project, i) => <Reveal key={project.slug} delay={i * 0.08}><ProjectCard project={project} compact={home} /></Reveal>)}</motion.div>
      {home && <div className="section-more"><span>03 PROJECTS / SELECTED</span><Link to="/projects" className="text-link">View all projects <ArrowRight size={15} /></Link></div>}
    </div>
  </section>
}

function GallerySection({ preview = false }: { preview?: boolean }) {
  const { content } = usePortfolio()
  const images = preview ? content.gallery.slice(0, 3) : content.gallery
  return <section className={`section gallery-section ${preview ? 'gallery-preview' : ''}`}>
    <div className="container">
      <div className="section-heading gallery-heading"><span className="section-index">07 / GALLERY</span><h2>Moments &amp; milestones</h2><p>A visual collection of work, learning, and meaningful moments.</p></div>
      {images.length ? <div className="gallery-grid">{images.map((image, index) => <Reveal key={`${image.imageUrl}-${index}`} delay={index * 0.06}><figure className="gallery-card"><img src={image.imageUrl} alt={image.title || 'Portfolio gallery image'} loading="lazy" /><figcaption><strong>{image.title}</strong>{image.description && <span>{image.description}</span>}</figcaption></figure></Reveal>)}</div> : <p className="gallery-empty">Gallery images will appear here as they are added.</p>}
      {preview && <div className="section-more"><span>GALLERY / MOMENTS</span><Link to="/gallery" className="text-link">View the gallery <ArrowRight size={15} /></Link></div>}
    </div>
  </section>
}

function Home() {
  const { content } = usePortfolio()
  return <>
    <PageMeta title="Software Engineer" description="Olaniyan Ahmad — software engineer, library and information science professional, and entrepreneur." />
    <Hero />
    <section className="section intro-section" id="intro"><div className="container intro-layout"><span className="section-index">01 / THE SHORT STORY</span><div className="intro-main"><Reveal><h2>I work where <span>technology</span>, knowledge, and possibility meet.</h2><p>{content.bio}</p><Link to="/about" className="text-link">A little more about me <ArrowRight size={15} /></Link></Reveal></div><div className="intro-aside"><span className="aside-index">AO / 001</span><span className="aside-asterisk"><Asterisk size={52} strokeWidth={0.8} /></span><span className="aside-caption">THREE PRACTICES.<br />ONE CURIOUS MIND.</span></div></div></section>
    <ProjectSection home />
    <GallerySection preview />
    <section className="section skills-preview"><div className="container"><SectionHeading index="04" title="Tools for the work" note="A practical mix of digital craft and information practice." /><div className="skill-chip-grid">{content.skills.slice(0, 6).map((skill, i) => <Reveal key={skill.title} delay={i * 0.05}><div className="skill-chip"><span className="skill-icon">{renderSkillIcon(skill.icon)}</span><div><h3>{skill.title}</h3><span>{skill.items.slice(0, 2).join(' · ')}</span></div><ArrowUpRight size={16} /></div></Reveal>)}</div><div className="section-more"><span>CAPABILITIES / IN PROGRESS</span><Link to="/skills" className="text-link">Explore skills <ArrowRight size={15} /></Link></div></div></section>
    <section className="section journey-preview"><div className="container journey-layout"><div><SectionHeading index="05" title="A work in progress" note="The best work comes from staying curious, learning in public, and building with purpose." /></div><div className="journey-card"><span className="journey-label">THE JOURNEY SO FAR</span><div className="journey-metric"><span className="metric-mark">∞</span><span>Always learning.<br />Always building.</span></div><p>Explore my background, education, and the experiences shaping what I make next.</p><Link to="/experience" className="text-link">View experience <ArrowRight size={15} /></Link></div></div></section>
    <section className="contact-banner"><div className="container contact-banner-inner"><div><span className="eyebrow">HAVE SOMETHING IN MIND?</span><h2>Let&apos;s build what&apos;s<br /><span>next.</span></h2></div><Link to="/contact" className="round-link"><ArrowUpRight size={24} /></Link></div></section>
  </>
}

function About() {
  const { content } = usePortfolio()
  const portraitUrl = content.portraitUrls?.[0] || content.portraitUrl
  return <PageShell title="About" subtitle="A builder, an organiser, an optimist." index="02" description="Learn more about Ahmad's work across web development, information science, and entrepreneurship.">
    <div className="about-lead"><Reveal><p className="lead-statement">{content.bio}<span>.</span></p></Reveal><Reveal delay={0.1}><p className="body-copy">I&apos;m Olaniyan Ahmad, a software engineer interested in the places where people, information, and technology come together—and in making those connections useful.</p><p className="body-copy">My primary focus is software engineering, complemented by Library and Information Science and entrepreneurship. I&apos;m motivated by thoughtful problem-solving, continuous learning, and the possibility of turning a good idea into something people can use.</p></Reveal></div>
    <Reveal><section className="about-profile" aria-label="Professional portrait"><div className="about-profile-frame">{portraitUrl ? <img src={portraitUrl} alt="Olaniyan Ahmad" /> : <div className="about-profile-empty"><UserRound size={36} /><span>PROFESSIONAL PORTRAIT</span><p>Add a profile photo from the dashboard to feature it here.</p><Link to="/admin" className="text-link">Open dashboard <ArrowUpRight size={14} /></Link></div>}</div><div className="about-profile-caption"><span className="mini-section-label">A LITTLE MORE PERSONAL</span><span>OLANIYAN AHMAD <Asterisk size={13} /></span></div></section></Reveal>
    <div className="values-grid"><div className="mini-section-label">WHAT GUIDES ME</div>{[{ n: '01', t: 'Make it useful', d: 'Good ideas should solve real problems and feel clear to the people using them.' }, { n: '02', t: 'Stay curious', d: 'Keep learning, question assumptions, and stay open to better ways of working.' }, { n: '03', t: 'Build with care', d: 'Bring intention and integrity to the details, not just the end result.' }].map(item => <Reveal key={item.n}><div className="value-card"><span>{item.n} / VALUE</span><h3>{item.t}</h3><p>{item.d}</p></div></Reveal>)}</div>
    <TimelineBlock title="The path so far" />
    <div className="placeholder-note"><Asterisk size={17} /> Add verified biographical details, institutions, dates, certifications, and achievements to personalise this page.</div>
  </PageShell>
}

function PageShell({ title, subtitle, index, total = '06', description, children }: { title: string; subtitle: string; index: string; total?: string; description: string; children: ReactNode }) {
  return <><PageMeta title={title} description={description} /><main className="inner-page container"><div className="page-heading"><span className="eyebrow"><span className="status-dot" /> {index} / {total} — AHMAD OLANIYAN</span><h1>{title}<span>.</span></h1><p>{subtitle}</p></div>{children}</main></>
}

function TimelineBlock({ title = 'Experience & milestones' }: { title?: string }) {
  const { content } = usePortfolio()
  return <section className="timeline-section"><div className="timeline-head"><span className="mini-section-label">THE TIMELINE</span><h2>{title}</h2></div><div className="timeline">{content.timeline.map((item, index) => <Reveal key={`${item.type}-${index}`}><article className="timeline-item"><div className="timeline-marker"><span>{String(index + 1).padStart(2, '0')}</span><i /></div><div className="timeline-body"><div className="timeline-top"><span className="timeline-type">{item.type}</span><span className="timeline-date">{item.date}</span></div><h3>{item.title}</h3><span className="timeline-org">{item.organisation}</span><p>{item.description}</p>{item.imageUrl && <a className="certificate-image-link" href={item.imageUrl} target="_blank" rel="noreferrer"><img className="certificate-image" src={item.imageUrl} alt={`${item.title} certificate or achievement`} loading="lazy" /><span>View image <ExternalLink size={14} /></span></a>}</div></article></Reveal>)}</div></section>
}

function GalleryPage() {
  return <PageShell title="Gallery" subtitle="A visual collection of work, learning, and meaningful moments." index="07" total="07" description="View photographs and images from Olaniyan Ahmad's software engineering work and milestones."><GallerySection /></PageShell>
}

function ProjectsPage() {
  return <PageShell title="Selected work" subtitle="Ideas built around useful problems and interesting possibilities." index="03" description="Explore Ahmad Olaniyan's work in web development, library technology, and entrepreneurship."><ProjectSection /><div className="placeholder-note"><Asterisk size={17} /> Project pages describe concepts. Add verified demo, repository, and image links when available.</div></PageShell>
}

function ProjectDetails() {
  const { slug } = useParams()
  const { content } = usePortfolio()
  const project = content.projects.find(item => item.slug === slug)
  if (!project) return <NotFound />
  const liveUrl = project.liveUrl ? safeExternalUrl(project.liveUrl) : ''
  const githubUrl = project.githubUrl ? safeExternalUrl(project.githubUrl) : ''
  return <PageShell title={project.name} subtitle={project.eyebrow} index="03" description={project.description}><Link to="/projects" className="text-link back-link"><ArrowLeft size={15} /> Back to projects</Link><ProjectVisual tone={project.tone} number={project.number} name={project.name} imageUrl={project.imageUrl} /><div className="detail-layout"><div><span className="mini-section-label">OVERVIEW</span><p className="detail-lead">{project.overview}</p></div><div className="detail-content"><h2>The challenge</h2><p>{project.problem}</p><h2>The approach</h2><p>{project.solution}</p><h2>Key features</h2><ul className="feature-list">{project.features.map(feature => <li key={feature}><Check size={15} />{feature}</li>)}</ul><h2>Tools & context</h2><div className="tag-row">{project.technologies.map(item => <span key={item} className="tag">{item}</span>)}</div>{liveUrl && <a className="text-link" href={liveUrl} target="_blank" rel="noreferrer">Open live project <ExternalLink size={14} /></a>}{githubUrl && <a className="text-link" href={githubUrl} target="_blank" rel="noreferrer">View source <Github size={14} /></a>}</div></div></PageShell>
}

function renderSkillIcon(icon: string) {
  const icons: Record<string, ReactNode> = { code: <Code2 />, server: <Server />, database: <Database />, book: <BookOpen />, sparkles: <Sparkles />, users: <Users /> }
  return icons[icon] ?? <Sparkles />
}

function SkillsPage() {
  const { content } = usePortfolio()
  return <PageShell title="The toolkit" subtitle="Skills grow with practice. This list is designed to grow with me." index="04" description="An overview of Ahmad's web development and information science skills."><div className="skills-grid">{content.skills.map((skill, i) => <Reveal key={skill.title} delay={i * 0.06}><article className="skill-card"><div className="skill-card-top"><span className="skill-icon large">{renderSkillIcon(skill.icon)}</span><span className="section-index">0{i + 1}</span></div><h2>{skill.title}</h2><p>{skill.items.join(' · ')}</p><span className="skill-card-foot">SKILLS & TOOLS <Asterisk size={14} /></span></article></Reveal>)}</div></PageShell>
}

function ExperiencePage() {
  return <PageShell title="Experience" subtitle="A growing journey across learning, digital craft, and enterprise." index="05" description="Ahmad Olaniyan's professional experience, education, and milestones."><TimelineBlock /><div className="experience-note"><div className="experience-symbol"><BookOpen size={25} /></div><div><span className="mini-section-label">A NOTE ON THIS PAGE</span><p>Dates, institutions, roles, certifications, and achievements are editable content placeholders. Add verified details to complete your professional timeline.</p></div></div></PageShell>
}

type ContactFields = { name: string; email: string; subject: string; message: string }

function ContactForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFields>()
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const onSubmit = async (values: ContactFields) => {
    setResult(null)
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    if (!serviceId || !templateId || !publicKey) {
      setResult({ type: 'error', message: 'The contact form is not connected yet. Add your EmailJS settings in .env.local before sending messages.' })
      return
    }
    setSending(true)
    try {
      await emailjs.send(serviceId, templateId, {
        from_name: values.name,
        reply_to: values.email,
        subject: values.subject,
        message: values.message,
      }, { publicKey })
      setResult({ type: 'success', message: 'Your message has been sent. Thanks for reaching out.' })
      reset()
    } catch (error) {
      console.error('EmailJS contact submission failed:', error)
      setResult({ type: 'error', message: 'We could not send your message. Please check the EmailJS configuration and try again.' })
    } finally {
      setSending(false)
    }
  }

  return <form className="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate>
    <div className="form-grid">
      <label className="form-field"><span>Your name</span><input placeholder="How should I address you?" autoComplete="name" {...register('name', { required: 'Please enter your name.' })} />{errors.name && <small className="field-error">{errors.name.message}</small>}</label>
      <label className="form-field"><span>Email address</span><input type="email" placeholder="you@example.com" autoComplete="email" {...register('email', { required: 'Please enter your email.', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' } })} />{errors.email && <small className="field-error">{errors.email.message}</small>}</label>
    </div>
    <label className="form-field"><span>Subject</span><input placeholder="What would you like to discuss?" {...register('subject', { required: 'Please add a subject.' })} />{errors.subject && <small className="field-error">{errors.subject.message}</small>}</label>
    <label className="form-field"><span>Your message</span><textarea rows={5} placeholder="A little context goes a long way..." {...register('message', { required: 'Please write a message.', minLength: { value: 10, message: 'Please add a little more detail.' } })} />{errors.message && <small className="field-error">{errors.message.message}</small>}</label>
    <div className="form-submit-row"><button type="submit" className="button button-primary" disabled={sending}>{sending ? 'Sending...' : 'Send message'}{sending ? <span className="spinner" /> : <Send size={15} />}</button><span>Usually replies within a few days.</span></div>
    <AnimatePresence>{result && <motion.p role="status" aria-live="polite" className={`form-result ${result.type}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{result.type === 'success' ? <Check size={16} /> : <Asterisk size={16} />}{result.message}</motion.p>}</AnimatePresence>
  </form>
}

function ContactPage() {
  const { content } = usePortfolio()
  return <PageShell title="Let’s talk" subtitle="Good things start with a conversation." index="06" description="Get in touch with Olaniyan Ahmad about ideas, collaboration, and opportunities."><div className="contact-layout"><div className="contact-intro"><span className="mini-section-label">GET IN TOUCH</span><h2>Tell me what<br />you&apos;re thinking<span>.</span></h2><p>Have a project in mind, want to collaborate, or simply want to say hello? Send a note.</p><div className="contact-details">{content.contactEmail ? <a href={`mailto:${content.contactEmail}`}><span className="contact-detail-icon"><Mail size={17} /></span><span><small>EMAIL</small>{content.contactEmail}</span><ArrowUpRight size={14} /></a> : <div className="contact-detail-static"><span className="contact-detail-icon"><Mail size={17} /></span><span><small>EMAIL</small>Add your preferred email address</span></div>}</div><div className="contact-socials"><span className="mini-section-label">ELSEWHERE</span><SocialRow /></div></div><div className="contact-form-wrap"><span className="form-caption">01 — SEND A MESSAGE</span><ContactForm /></div></div></PageShell>
}

function NotFound() {
  return <PageShell title="Page not found" subtitle="This page may have moved, or it may never have existed." index="404" description="The page you're looking for could not be found."><div className="not-found"><span>404 / LOST IN THE INTERFACE</span><p>Let&apos;s get you back to somewhere useful.</p><Link className="button button-primary" to="/">Back to home <ArrowRight size={16} /></Link></div></PageShell>
}

function App() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const navigationLocked = useRef(false)
  const navigationTimer = useRef<number | undefined>(undefined)
  const isAdmin = location.pathname === '/admin'
  const [theme, setTheme] = useState(() => localStorage.getItem('ao-theme') ?? 'dark')
  const handleInternalNavigation = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const anchor = target.closest('a')
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target === '_blank') return
    const destination = new URL(anchor.href, window.location.href)
    if (destination.origin !== window.location.origin || destination.pathname === location.pathname || destination.hash && destination.pathname === location.pathname) return
    if (navigationLocked.current) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    if (reduceMotion) return
    navigationLocked.current = true
    navigationTimer.current = window.setTimeout(() => { navigationLocked.current = false }, 760)
  }
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('ao-theme', theme)
  }, [theme])
  useEffect(() => () => window.clearTimeout(navigationTimer.current), [])
  const pageTransition = reduceMotion
    ? { initial: false as const, animate: { rotateX: 0, opacity: 1 }, exit: { rotateX: 0, opacity: 1 }, transition: { duration: 0 } }
    : {
      initial: { rotateX: 90, opacity: 0.92 },
      animate: { rotateX: 0, opacity: 1 },
      exit: { rotateX: -90, opacity: 0.92 },
      transition: { duration: 0.36, ease: [0.22, 0.72, 0.18, 1] as const },
    }
  return <div className="app-shell" onClickCapture={handleInternalNavigation}><div className="route-stage"><AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}><motion.div key={location.pathname} className="page-transition" style={{ transformPerspective: 1400, transformOrigin: 'top center', backfaceVisibility: 'hidden' }} {...pageTransition}>{!isAdmin && <Header theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />}<Routes location={location}><Route path="/" element={<Home />} /><Route path="/about" element={<About />} /><Route path="/projects" element={<ProjectsPage />} /><Route path="/projects/:slug" element={<ProjectDetails />} /><Route path="/skills" element={<SkillsPage />} /><Route path="/experience" element={<ExperiencePage />} /><Route path="/gallery" element={<GalleryPage />} /><Route path="/files" element={<FilesPage />} /><Route path="/contact" element={<ContactPage />} /><Route path="/admin" element={<AdminPage />} /><Route path="*" element={<NotFound />} /></Routes>{!isAdmin && <Footer />}</motion.div></AnimatePresence></div><BackToTop /></div>
}

export default App
