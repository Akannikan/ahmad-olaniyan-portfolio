import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { BookOpen, BriefcaseBusiness, Check, ExternalLink, FileText, ImagePlus, LogOut, Plus, Save, Trash2, Upload, UserRound, X } from 'lucide-react'
import type { PortfolioContent, Project } from './data'
import { supabase, usePortfolio } from './portfolio'

type AdminTab = 'profile' | 'projects' | 'experience' | 'skills'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) setError(`Sign-in failed: ${authError.message}`)
    setBusy(false)
  }

  return <section className="admin-login">
    <span className="eyebrow"><span className="status-dot" /> PRIVATE CONTENT MANAGEMENT</span>
    <h1>Sign in<span>.</span></h1>
    <p>Use the admin account created in your Supabase project. Public visitors cannot edit portfolio content.</p>
    <form className="contact-form" onSubmit={signIn}>
      <label className="form-field"><span>Email address</span><input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label className="form-field"><span>Password</span><input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
      {error && <p className="form-result error" role="alert">{error}</p>}
      <button className="button button-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ExternalLink size={15} /></button>
    </form>
  </section>
}

function FileUploader({ kind, label, value, accept, onChange }: {
  kind: 'portrait' | 'cv' | 'project'
  label: string
  value: string
  accept: string
  onChange: (url: string) => void
}) {
  const { uploadAsset } = usePortfolio()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const isPortrait = kind !== 'cv'
    if (isPortrait && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (isPortrait) {
      try {
        const bitmap = await createImageBitmap(file)
        const tooLarge = bitmap.width * bitmap.height > 25000000
        bitmap.close()
        if (tooLarge) {
          setError('Image dimensions are too large. Choose a photo smaller than 25 megapixels.')
          return
        }
      } catch {
        setError('The selected image could not be opened. Try another JPG, PNG, or WebP file.')
        return
      }
    }
    if (kind === 'cv' && file.type !== 'application/pdf') {
      setError('Choose a PDF file for your CV.')
      return
    }
    const maxSize = kind === 'cv' ? 10 : 5
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File is too large. Maximum size: ${maxSize} MB.`)
      return
    }
    setBusy(true)
    setError('')
    try {
      onChange(await uploadAsset(file, kind))
    } catch (uploadError) {
      setError(`Upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unexpected storage error.'}`)
    } finally {
      setBusy(false)
    }
  }

  return <div className="admin-uploader">
    <div className="admin-uploader-preview">
      {value && kind !== 'cv' ? <img src={value} alt={`${label} preview`} /> : <span>{kind === 'cv' ? <FileText size={22} /> : <ImagePlus size={22} />}</span>}
      <div><strong>{label}</strong><small>{value ? 'File uploaded' : kind === 'cv' ? 'PDF · up to 10 MB' : 'JPG, PNG, or WebP · up to 5 MB'}</small></div>
    </div>
    <label className="button button-small admin-upload-button"><input type="file" accept={accept} onChange={upload} disabled={busy} />{busy ? 'Uploading…' : <><Upload size={13} /> {value ? 'Replace' : 'Upload'}</>}</label>
    {value && <button className="admin-remove-link" type="button" onClick={() => onChange('')}><X size={12} /> Remove</button>}
    {error && <small className="field-error admin-upload-error" role="alert">{error}</small>}
  </div>
}

function Field({ label, value, onChange, multiline = false, placeholder = '' }: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  return <label className="form-field"><span>{label}</span>{multiline
    ? <textarea rows={4} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />
    : <input value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />}</label>
}

function EditorCard({ title, subtitle, onRemove, children }: { title: string; subtitle: string; onRemove: () => void; children: ReactNode }) {
  return <article className="admin-editor-card"><div className="admin-editor-card-head"><div><strong>{title}</strong><small>{subtitle}</small></div><button className="icon-button" type="button" onClick={onRemove} aria-label={`Remove ${title}`}><Trash2 size={15} /></button></div>{children}</article>
}

export default function AdminPage() {
  const { content, configured, adminUserId, configurationIssue, loading, saveError, saveContent } = usePortfolio()
  const [userId, setUserId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PortfolioContent>(content)
  const [tab, setTab] = useState<AdminTab>('profile')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft(content)
  }, [content])

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(`Could not check your sign-in: ${sessionError.message}`)
      setUserId(data.session?.user.id ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const update = (patch: Partial<PortfolioContent>) => setDraft(current => ({ ...current, ...patch }))
  const persist = async () => {
    const slugs = draft.projects.map(project => project.slug.trim())
    if (draft.projects.some(project => !project.name.trim() || !project.slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug.trim()))) {
      setError('Every project needs a name and a URL slug using lowercase letters, numbers, and hyphens.')
      setNotice('')
      return
    }
    if (new Set(slugs).size !== slugs.length) {
      setError('Project URL slugs must be unique.')
      setNotice('')
      return
    }
    setSaving(true)
    setNotice('')
    setError('')
    try {
      await saveContent(draft)
      setNotice('Saved. Your public portfolio now shows these changes.')
    } catch (saveFailure) {
      setError(saveFailure instanceof Error ? saveFailure.message : 'Could not save your changes.')
    } finally {
      setSaving(false)
    }
  }

  const signOut = async () => {
    if (!supabase) return
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) setError(`Sign-out failed: ${signOutError.message}`)
  }

  if (!configured) return <main className="admin-page container"><Helmet><title>Dashboard setup — Ahmad Olaniyan</title><meta name="robots" content="noindex,nofollow" /></Helmet><section className="admin-setup"><span className="eyebrow"><span className="status-dot" /> DASHBOARD SETUP</span><h1>Connect your content workspace<span>.</span></h1><p>The portfolio itself can load without Supabase; the dashboard needs its connection values set correctly in <code>.env.local</code>.</p>{configurationIssue && <p className="form-result error" role="alert">{configurationIssue}</p>}<div className="admin-setup-steps"><span>01 / Create a Supabase project</span><span>02 / Copy its HTTPS Project URL and anon key from Project Settings → API</span><span>03 / Run <code>supabase/schema.sql</code> and configure the admin UUID</span><span>04 / Restart <code>npm run dev</code></span></div><Link to="/" className="text-link">Back to portfolio <ExternalLink size={14} /></Link></section></main>
  if (loading) return <main className="admin-page container"><p className="admin-loading">Loading your saved portfolio…</p></main>
  if (!userId) return <main className="admin-page container"><Helmet><title>Sign in — Ahmad Olaniyan</title><meta name="robots" content="noindex,nofollow" /></Helmet><AdminLogin /></main>
  if (userId !== adminUserId) return <main className="admin-page container"><Helmet><title>Access denied — Ahmad Olaniyan</title><meta name="robots" content="noindex,nofollow" /></Helmet><section className="admin-login"><span className="eyebrow">ACCOUNT NOT AUTHORISED</span><h1>Access denied<span>.</span></h1><p>This account does not match the configured portfolio administrator.</p><button className="button button-primary" onClick={() => void signOut()}>Sign out <LogOut size={15} /></button></section></main>

  const tabs: { id: AdminTab; label: string; icon: ReactNode }[] = [
    { id: 'profile', label: 'Profile & files', icon: <UserRound size={16} /> },
    { id: 'projects', label: 'Projects', icon: <ImagePlus size={16} /> },
    { id: 'experience', label: 'Experience', icon: <BriefcaseBusiness size={16} /> },
    { id: 'skills', label: 'Skills', icon: <BookOpen size={16} /> },
  ]

  return <main className="admin-page container">
    <Helmet><title>Dashboard — Ahmad Olaniyan</title><meta name="robots" content="noindex,nofollow" /></Helmet>
    <div className="admin-heading"><div><span className="eyebrow"><span className="status-dot" /> PRIVATE CONTENT MANAGEMENT</span><h1>Your dashboard<span>.</span></h1><p>Changes are published to the portfolio when you save.</p></div><div className="admin-heading-actions"><Link to="/" className="button button-small">View website <ExternalLink size={14} /></Link><button className="button button-small admin-signout" onClick={() => void signOut()}>Sign out <LogOut size={14} /></button></div></div>
    <div className="admin-workspace">
      <nav className="admin-tabs" aria-label="Dashboard sections">{tabs.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); setNotice(''); setError('') }}>{item.icon}{item.label}</button>)}</nav>
      <section className="admin-editor">
        {saveError && <p className="form-result error" role="alert">{saveError}</p>}
        {tab === 'profile' && <div className="admin-section"><div className="admin-section-heading"><h2>Profile & downloadable files</h2><p>Your photo is shown on your site and included in a generated profile CV PDF.</p></div>
          <div className="admin-profile-layout"><div className="admin-fields"><Field label="Professional introduction" multiline value={draft.bio} onChange={bio => update({ bio })} /><Field label="Professional roles (one per line)" multiline value={draft.professionalRoles.join('\n')} onChange={value => update({ professionalRoles: value.split('\n').map(item => item.trim()).filter(Boolean) })} /><Field label="Public email address" value={draft.contactEmail} onChange={contactEmail => update({ contactEmail })} placeholder="name@example.com" /><Field label="LinkedIn URL" value={draft.socialLinks.find(item => item.label === 'LinkedIn')?.href ?? ''} onChange={href => update({ socialLinks: draft.socialLinks.map(item => item.label === 'LinkedIn' ? { ...item, href } : item) })} placeholder="https://linkedin.com/in/…" /><Field label="GitHub URL" value={draft.socialLinks.find(item => item.label === 'GitHub')?.href ?? ''} onChange={href => update({ socialLinks: draft.socialLinks.map(item => item.label === 'GitHub' ? { ...item, href } : item) })} placeholder="https://github.com/…" /></div><div className="admin-file-fields"><FileUploader kind="portrait" label="Passport / profile photo" value={draft.portraitUrl} accept="image/jpeg,image/png,image/webp" onChange={portraitUrl => update({ portraitUrl })} /><FileUploader kind="cv" label="Original CV PDF" value={draft.cvUrl} accept="application/pdf,.pdf" onChange={cvUrl => update({ cvUrl })} /><p className="admin-help">Your photo is embedded in the site-generated CV PDF. The original CV is also available as a separate download.</p></div></div>
        </div>}
        {tab === 'projects' && <div className="admin-section"><div className="admin-section-heading"><h2>Projects & work</h2><p>Add projects, descriptions, categories, links, and project images.</p></div><div className="admin-card-list">{draft.projects.map((project, index) => <EditorCard key={`${project.slug}-${index}`} title={project.name || `Project ${index + 1}`} subtitle={project.category} onRemove={() => update({ projects: draft.projects.filter((_, itemIndex) => itemIndex !== index) })}><div className="admin-fields"><Field label="Project name" value={project.name} onChange={name => updateProject(index, { name })} /><Field label="URL slug" value={project.slug} onChange={slug => updateProject(index, { slug })} /><label className="form-field"><span>Category</span><select value={project.category} onChange={event => updateProject(index, { category: event.target.value as Project['category'] })}><option>Web Development</option><option>Library Technology</option><option>Business / Entrepreneurship</option></select></label><Field label="Short description" multiline value={project.description} onChange={description => updateProject(index, { description })} /><Field label="Overview" multiline value={project.overview} onChange={overview => updateProject(index, { overview })} /><Field label="Problem" multiline value={project.problem} onChange={problem => updateProject(index, { problem })} /><Field label="Solution" multiline value={project.solution} onChange={solution => updateProject(index, { solution })} /><Field label="Key features (one per line)" multiline value={project.features.join('\n')} onChange={value => updateProject(index, { features: value.split('\n').map(item => item.trim()).filter(Boolean) })} /><Field label="Technologies (comma separated)" value={project.technologies.join(', ')} onChange={value => updateProject(index, { technologies: value.split(',').map(item => item.trim()).filter(Boolean) })} /><Field label="Live demo URL (optional)" value={project.liveUrl ?? ''} onChange={liveUrl => updateProject(index, { liveUrl })} /><Field label="GitHub URL (optional)" value={project.githubUrl ?? ''} onChange={githubUrl => updateProject(index, { githubUrl })} /></div><FileUploader kind="project" label="Project image" value={project.imageUrl ?? ''} accept="image/jpeg,image/png,image/webp" onChange={imageUrl => updateProject(index, { imageUrl })} /></EditorCard>)}</div><button className="button admin-add-button" onClick={() => update({ projects: [...draft.projects, newProject(draft.projects.length)] })}><Plus size={15} /> Add a project</button></div>}
        {tab === 'experience' && <div className="admin-section"><div className="admin-section-heading"><h2>Experience, education & achievements</h2><p>Manage the timeline shown on the About, Experience, and CV pages.</p></div><div className="admin-card-list">{draft.timeline.map((item, index) => <EditorCard key={`${item.title}-${index}`} title={item.title || `Timeline item ${index + 1}`} subtitle={item.type} onRemove={() => update({ timeline: draft.timeline.filter((_, itemIndex) => itemIndex !== index) })}><div className="admin-fields"><Field label="Type (Experience, Education, Certification…)" value={item.type} onChange={type => updateTimeline(index, { type })} /><Field label="Role, qualification, or achievement" value={item.title} onChange={title => updateTimeline(index, { title })} /><Field label="Organisation or institution" value={item.organisation} onChange={organisation => updateTimeline(index, { organisation })} /><Field label="Dates" value={item.date} onChange={date => updateTimeline(index, { date })} /><Field label="Description" multiline value={item.description} onChange={description => updateTimeline(index, { description })} /></div></EditorCard>)}</div><button className="button admin-add-button" onClick={() => update({ timeline: [...draft.timeline, { type: 'Experience', title: '', organisation: '', date: '', description: '' }] })}><Plus size={15} /> Add a timeline item</button></div>}
        {tab === 'skills' && <div className="admin-section"><div className="admin-section-heading"><h2>Skills & tools</h2><p>List confirmed skills by category. No proficiency scores are shown.</p></div><div className="admin-card-list">{draft.skills.map((skill, index) => <EditorCard key={`${skill.title}-${index}`} title={skill.title || `Skill group ${index + 1}`} subtitle="Skill category" onRemove={() => update({ skills: draft.skills.filter((_, itemIndex) => itemIndex !== index) })}><div className="admin-fields"><Field label="Category" value={skill.title} onChange={title => updateSkill(index, { title })} /><Field label="Skills (one per line)" multiline value={skill.items.join('\n')} onChange={value => updateSkill(index, { items: value.split('\n').map(item => item.trim()).filter(Boolean) })} /></div></EditorCard>)}</div><button className="button admin-add-button" onClick={() => update({ skills: [...draft.skills, { title: '', items: [], icon: 'sparkles' }] })}><Plus size={15} /> Add a skill category</button></div>}
        {(notice || error) && <p className={`form-result ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>{error ? <X size={16} /> : <Check size={16} />}{error || notice}</p>}
        <div className="admin-save-row"><span>Saved changes update the public site.</span><button className="button button-primary" disabled={saving} onClick={() => void persist()}>{saving ? 'Saving…' : 'Save changes'} <Save size={15} /></button></div>
      </section>
    </div>
  </main>

  function updateProject(index: number, patch: Partial<Project>) {
    update({ projects: draft.projects.map((project, itemIndex) => itemIndex === index ? { ...project, ...patch } : project) })
  }
  function updateTimeline(index: number, patch: Partial<PortfolioContent['timeline'][number]>) {
    update({ timeline: draft.timeline.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  }
  function updateSkill(index: number, patch: Partial<PortfolioContent['skills'][number]>) {
    update({ skills: draft.skills.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  }
}

function newProject(number: number): Project {
  return {
    slug: `project-${Date.now()}`,
    name: '',
    eyebrow: 'A project in progress',
    description: '',
    overview: '',
    problem: '',
    solution: '',
    features: [],
    category: 'Web Development',
    technologies: [],
    number: String(number + 1).padStart(2, '0'),
    tone: 'blue',
  }
}
