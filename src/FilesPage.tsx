import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Download, ExternalLink, FileText, Film, Image, Search, Trash2, Upload, X } from 'lucide-react'
import { supabase, usePortfolio } from './portfolio'

const maxFileSize = 25 * 1024 * 1024
const acceptedMimeTypes: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword', 'application/octet-stream'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'],
  xls: ['application/vnd.ms-excel', 'application/octet-stream'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'],
  ppt: ['application/vnd.ms-powerpoint', 'application/octet-stream'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/octet-stream'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  svg: ['image/svg+xml', 'image/svg'],
  mp4: ['video/mp4'],
}
const fileAccept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.svg,.mp4'
const filterOptions = ['All files', 'Documents', 'Images', 'Video'] as const
type FileFilter = typeof filterOptions[number]

type DocumentRecord = {
  id: string
  title: string
  description: string
  file_name: string
  file_extension: string
  file_type: string
  file_size: number
  storage_path: string
  is_public: boolean
  created_at: string
}

function isAllowedFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return (acceptedMimeTypes[extension] ?? []).includes(file.type)
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileKind(mime: string) {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  return 'document'
}

function FileIcon({ mime }: { mime: string }) {
  const kind = fileKind(mime)
  if (kind === 'image') return <Image size={20} />
  if (kind === 'video') return <Film size={20} />
  return <FileText size={20} />
}

export default function FilesPage() {
  const { configured, adminUserId } = usePortfolio()
  const [userId, setUserId] = useState<string | null>(null)
  const [files, setFiles] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filesLoadError, setFilesLoadError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FileFilter>('All files')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const isAdmin = configured && userId === adminUserId

  const loadFiles = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      setFilesLoadError(true)
      setError('File storage is not configured. Follow the Supabase setup in README.md.')
      return
    }
    const { data, error: loadError } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    if (loadError) {
      setFilesLoadError(true)
      setError(loadError.code === 'PGRST205'
        ? 'Files & Documents is not fully configured. Run the updated supabase/schema.sql script and wait for the Supabase schema cache to refresh.'
        : `Could not load files: ${loadError.message}`)
    } else {
      setFiles((data ?? []) as DocumentRecord[])
      setFilesLoadError(false)
      setError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!supabase) {
      void loadFiles()
      return
    }
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(`Could not check your sign-in: ${sessionError.message}`)
      setUserId(data.session?.user.id ?? null)
      void loadFiles()
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
      void loadFiles()
    })
    return () => subscription.unsubscribe()
  }, [loadFiles])

  const visibleFiles = useMemo(() => files.filter(file => {
    const matchesQuery = `${file.title} ${file.description} ${file.file_name}`.toLowerCase().includes(query.trim().toLowerCase())
    const kind = fileKind(file.file_type)
    const matchesFilter = filter === 'All files'
      || (filter === 'Documents' && kind === 'document')
      || (filter === 'Images' && kind === 'image')
      || (filter === 'Video' && kind === 'video')
    return matchesQuery && matchesFilter
  }), [files, filter, query])

  const getFileUrl = async (file: DocumentRecord, download = false) => {
    if (!supabase) throw new Error('File storage is not configured.')
    const bucket = file.is_public ? 'portfolio-documents-public' : 'portfolio-documents-private'
    if (file.is_public) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(file.storage_path, { download: download ? file.title : false })
      return data.publicUrl
    }
    if (!isAdmin) throw new Error('You are not authorised to access this private file.')
    const { data, error: urlError } = await supabase.storage.from(bucket).createSignedUrl(file.storage_path, 60 * 10, { download: download ? file.title : false })
    if (urlError) throw urlError
    return data.signedUrl
  }

  const uploadFile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const input = form.elements.namedItem('document-file')
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined
    setError('')
    setNotice('')
    if (!isAdmin || !supabase) {
      setError('Only the configured administrator can upload files.')
      return
    }
    if (!file) {
      setError('Choose a file to upload.')
      return
    }
    if (!isAllowedFile(file)) {
      setError('The selected file type does not match an allowed format.')
      return
    }
    if (file.size === 0 || file.size > maxFileSize) {
      setError('Files must be no larger than 25 MB.')
      return
    }
    if (!title.trim() || title.trim().length > 150 || description.length > 1000) {
      setError('Add a title (up to 150 characters) and keep the description under 1,000 characters.')
      return
    }
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    const path = `${crypto.randomUUID()}.${extension}`
    const bucket = isPublic ? 'portfolio-documents-public' : 'portfolio-documents-private'
    setBusy(true)
    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      })
      if (uploadError) throw uploadError
      const { error: insertError } = await supabase.from('documents').insert({
        title: title.trim(),
        description: description.trim(),
        file_name: file.name,
        file_extension: extension,
        file_type: file.type,
        file_size: file.size,
        storage_path: path,
        is_public: isPublic,
      })
      if (insertError) {
        const { error: cleanupError } = await supabase.storage.from(bucket).remove([path])
        if (cleanupError) console.error('Could not remove the uploaded file after its record failed to save:', cleanupError)
        throw insertError
      }
      setTitle('')
      setDescription('')
      setIsPublic(false)
      form.reset()
      setNotice('File uploaded successfully.')
      await loadFiles()
    } catch (uploadError) {
      setError(`Upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unexpected storage error.'}`)
    } finally {
      setBusy(false)
    }
  }

  const deleteFile = async (file: DocumentRecord) => {
    if (!supabase || !isAdmin) return
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const bucket = file.is_public ? 'portfolio-documents-public' : 'portfolio-documents-private'
      const { error: deleteRowError } = await supabase.from('documents').delete().eq('id', file.id)
      if (deleteRowError) throw deleteRowError
      const { error: deleteObjectError } = await supabase.storage.from(bucket).remove([file.storage_path])
      if (deleteObjectError) throw new Error(`The file record was removed, but the stored object could not be deleted: ${deleteObjectError.message}`)
      if (previewId === file.id) {
        setPreviewId(null)
        setPreviewUrl('')
      }
      setNotice('File deleted.')
      await loadFiles()
    } catch (deleteError) {
      setError(`Could not delete the file: ${deleteError instanceof Error ? deleteError.message : 'Unexpected storage error.'}`)
      await loadFiles()
    } finally {
      setBusy(false)
    }
  }

  const replaceFile = async (fileRecord: DocumentRecord, event: ChangeEvent<HTMLInputElement>) => {
    const replacement = event.target.files?.[0]
    event.target.value = ''
    if (!replacement || !supabase || !isAdmin) return
    setError('')
    setNotice('')
    if (!isAllowedFile(replacement) || replacement.size === 0 || replacement.size > maxFileSize) {
      setError('Choose a valid supported file no larger than 25 MB.')
      return
    }
    const extension = replacement.name.split('.').pop()?.toLowerCase() ?? ''
    const newPath = `${crypto.randomUUID()}.${extension}`
    const bucket = fileRecord.is_public ? 'portfolio-documents-public' : 'portfolio-documents-private'
    setBusy(true)
    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(newPath, replacement, { contentType: replacement.type, upsert: false })
      if (uploadError) throw uploadError
      const { error: updateError } = await supabase.from('documents').update({
        file_name: replacement.name,
        file_extension: extension,
        file_type: replacement.type,
        file_size: replacement.size,
        storage_path: newPath,
      }).eq('id', fileRecord.id)
      if (updateError) {
        const { error: cleanupError } = await supabase.storage.from(bucket).remove([newPath])
        if (cleanupError) console.error('Could not remove the replacement file after its record failed to update:', cleanupError)
        throw updateError
      }
      const { error: removeError } = await supabase.storage.from(bucket).remove([fileRecord.storage_path])
      if (removeError) console.error('The replacement is active, but the previous file could not be removed:', removeError)
      setNotice('File replaced successfully.')
      await loadFiles()
      if (previewId === fileRecord.id) {
        const refreshed = { ...fileRecord, storage_path: newPath, file_type: replacement.type }
        setPreviewUrl(await getFileUrl(refreshed))
      }
    } catch (replaceError) {
      setError(`Could not replace the file: ${replaceError instanceof Error ? replaceError.message : 'Unexpected storage error.'}`)
    } finally {
      setBusy(false)
    }
  }

  const togglePreview = async (file: DocumentRecord) => {
    if (previewId === file.id) {
      setPreviewId(null)
      setPreviewUrl('')
      return
    }
    setError('')
    try {
      setPreviewUrl(await getFileUrl(file))
      setPreviewId(file.id)
    } catch (previewError) {
      setError(`Could not preview the file: ${previewError instanceof Error ? previewError.message : 'Unexpected storage error.'}`)
    }
  }

  const downloadFile = async (file: DocumentRecord) => {
    setError('')
    const downloadWindow = window.open('', '_blank')
    if (!downloadWindow) {
      setError('Allow pop-ups to download this file.')
      return
    }
    try {
      downloadWindow.opener = null
      downloadWindow.location.href = await getFileUrl(file, true)
    } catch (downloadError) {
      downloadWindow.close()
      setError(`Could not download the file: ${downloadError instanceof Error ? downloadError.message : 'Unexpected storage error.'}`)
    }
  }

  return <main className="inner-page container files-page">
    <Helmet><title>Files &amp; Documents — Ahmad Olaniyan</title><meta name="description" content="Browse and download public documents from Olaniyan Ahmad." /><meta name="robots" content={isAdmin ? 'noindex,nofollow' : 'index,follow'} /></Helmet>
    <div className="page-heading"><span className="eyebrow"><span className="status-dot" /> FILES &amp; DOCUMENTS</span><h1>Resource library<span>.</span></h1><p>Browse public files and documents. Private admin files remain restricted to the administrator.</p></div>
    {isAdmin && <form className="document-upload-panel" onSubmit={uploadFile}>
      <div className="admin-section-heading"><h2>Upload a file</h2><p>PDF, Office documents, JPG, PNG, SVG, or MP4 · up to 25 MB.</p></div>
      <div className="document-upload-fields">
        <label className="form-field"><span>Choose a file</span><input name="document-file" type="file" accept={fileAccept} required disabled={busy} /></label>
        <label className="form-field"><span>File title</span><input value={title} onChange={event => setTitle(event.target.value)} maxLength={150} required disabled={busy} /></label>
        <label className="form-field"><span>Description</span><textarea rows={3} value={description} onChange={event => setDescription(event.target.value)} maxLength={1000} disabled={busy} /></label>
        <label className="document-visibility"><input type="checkbox" checked={isPublic} onChange={event => setIsPublic(event.target.checked)} disabled={busy} /><span>Make this file public and downloadable</span></label>
      </div>
      <button className="button button-primary" type="submit" disabled={busy}><Upload size={15} />{busy ? 'Uploading…' : 'Upload file'}{busy && <span className="spinner" />}</button>
    </form>}
    {error && <p className="form-result error" role="alert">{error}</p>}
    {notice && <p className="form-result success" role="status">{notice}</p>}
    <div className="document-tools">
      <label className="document-search"><Search size={16} /><span className="sr-only">Search files</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search files…" /></label>
      <div className="filter-row" aria-label="Filter files">{filterOptions.map(option => <button key={option} type="button" className={`filter-button ${filter === option ? 'active' : ''}`} onClick={() => setFilter(option)}>{option}</button>)}</div>
    </div>
    {loading ? <p className="admin-loading" role="status">Loading files…</p>
      : filesLoadError ? <p className="gallery-empty">Documents could not be loaded. Check the Supabase setup instructions and try again.</p>
      : visibleFiles.length ? <div className="document-grid">{visibleFiles.map(file => {
        const kind = fileKind(file.file_type)
        const canPreview = ['application/pdf', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/svg', 'video/mp4'].includes(file.file_type)
        return <article className="document-card" key={file.id}>
          <div className="document-card-head"><span className="document-icon"><FileIcon mime={file.file_type} /></span><span className="document-format">{file.file_name.split('.').pop()?.toUpperCase()}</span></div>
          <h2>{file.title}</h2>
          {file.description && <p className="document-description">{file.description}</p>}
          <div className="document-meta"><span title={file.file_name}>{file.file_name}</span><span>{formatBytes(file.file_size)}</span><time dateTime={file.created_at}>{new Date(file.created_at).toLocaleDateString()}</time><span className={file.is_public ? 'document-public' : 'document-private'}>{file.is_public ? 'Public' : 'Private'}</span></div>
          {previewId === file.id && previewUrl && <div className="document-preview">
            {kind === 'image' ? <img src={previewUrl} alt={file.title} />
              : kind === 'video' ? <video src={previewUrl} controls preload="metadata">{'Your browser does not support video playback.'}</video>
                : file.file_type === 'application/pdf' ? <iframe src={previewUrl} title={`Preview: ${file.title}`} sandbox="" />
                  : <p>Preview is not available in the browser for this file. Download it to view its contents.</p>}
            <button type="button" className="document-preview-close icon-button" onClick={() => { setPreviewId(null); setPreviewUrl('') }} aria-label="Close preview"><X size={15} /></button>
          </div>}
          <div className="document-actions">
            {canPreview && <button type="button" className="text-link" onClick={() => void togglePreview(file)}>{previewId === file.id ? 'Close preview' : 'Preview'} <ExternalLink size={14} /></button>}
            <button type="button" className="text-link" onClick={() => void downloadFile(file)}><Download size={14} /> Download</button>
            {isAdmin && <label className="document-replace text-link"><Upload size={14} /> Replace<input type="file" accept={fileAccept} disabled={busy} onChange={event => void replaceFile(file, event)} /></label>}
            {isAdmin && <button type="button" className="document-delete" onClick={() => void deleteFile(file)} disabled={busy} aria-label={`Delete ${file.file_name}`}><Trash2 size={15} /></button>}
          </div>
        </article>
      })}</div> : <p className="gallery-empty">{query || filter !== 'All files' ? 'No files match your search or filter.' : isAdmin ? 'No files yet. Upload a document to get started.' : 'No public files are available yet.'}</p>}
    {!isAdmin && <p className="document-admin-link"><Link className="text-link" to="/admin">Administrator sign in <ExternalLink size={14} /></Link></p>}
  </main>
}
