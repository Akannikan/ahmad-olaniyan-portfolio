import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { initialPortfolioContent, type PortfolioContent } from './data'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const adminUserId = import.meta.env.VITE_ADMIN_USER_ID

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export let supabase: SupabaseClient | null = null
let supabaseInitError = ''
if (supabaseUrl && supabaseAnonKey && isHttpUrl(supabaseUrl)) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    supabaseInitError = error instanceof Error ? error.message : 'Supabase could not be initialized.'
    console.error('Supabase configuration is invalid:', error)
  }
}

type PortfolioContextValue = {
  content: PortfolioContent
  configured: boolean
  adminUserId: string
  configurationIssue: string
  loading: boolean
  saveError: string
  saveContent: (nextContent: PortfolioContent) => Promise<void>
  uploadAsset: (file: File, kind: 'portrait' | 'cv' | 'project' | 'certificate' | 'gallery') => Promise<string>
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState(initialPortfolioContent)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [saveError, setSaveError] = useState('')

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase.from('portfolio_content').select('content').eq('id', 'main').maybeSingle()
    if (error) {
      setSaveError(`Could not load saved portfolio content: ${error.message}`)
      setLoading(false)
      return
    }
    if (data?.content) {
      const saved = data.content as Partial<PortfolioContent>
      const savedSocialLinks = saved.socialLinks ?? []
      const socialLinks = [
        ...initialPortfolioContent.socialLinks.map(link => savedSocialLinks.find(savedLink => savedLink.label === link.label) ?? link),
        ...savedSocialLinks.filter(link => !initialPortfolioContent.socialLinks.some(defaultLink => defaultLink.label === link.label)),
      ]
      setContent({
        ...initialPortfolioContent,
        ...saved,
        professionalRoles: saved.professionalRoles?.length
          ? ['Software Engineer', ...saved.professionalRoles.filter(role => role.toLowerCase() !== 'software engineer')]
          : initialPortfolioContent.professionalRoles,
        socialLinks,
        gallery: saved.gallery ?? initialPortfolioContent.gallery,
      })
    }
    setSaveError('')
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
    const client = supabase
    if (!client) return
    const channel = client.channel('public-portfolio-content')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_content', filter: 'id=eq.main' }, () => { void refresh() })
      .subscribe()
    return () => { void client.removeChannel(channel) }
  }, [refresh])

  const saveContent = useCallback(async (nextContent: PortfolioContent) => {
    if (!supabase) throw new Error('Supabase is not configured. Follow the setup steps in README.md.')
    const normalizedContent: PortfolioContent = {
      ...nextContent,
      professionalRoles: nextContent.professionalRoles.length
        ? ['Software Engineer', ...nextContent.professionalRoles.filter(role => role.toLowerCase() !== 'software engineer')]
        : initialPortfolioContent.professionalRoles,
    }
    setSaveError('')
    const { error } = await supabase.from('portfolio_content').upsert({ id: 'main', content: normalizedContent })
    if (error) {
      setSaveError(`Could not save your changes: ${error.message}`)
      throw error
    }
    setContent(normalizedContent)
  }, [])

  const uploadAsset = useCallback(async (file: File, kind: 'portrait' | 'cv' | 'project' | 'certificate' | 'gallery') => {
    if (!supabase) throw new Error('Supabase is not configured. Follow the setup steps in README.md.')
    const suffix = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const path = `${kind}/${crypto.randomUUID()}.${suffix}`
    const { error } = await supabase.storage.from('portfolio-assets').upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })
    if (error) throw error
    const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(path)
    return data.publicUrl
  }, [])

  const value = useMemo(() => ({
    content,
    configured: Boolean(supabase && adminUserId && isUuid(adminUserId)),
    adminUserId: adminUserId ?? '',
    configurationIssue: supabaseInitError || (
      !supabaseUrl || !supabaseAnonKey
        ? 'Supabase URL or anon key is missing.'
        : !isHttpUrl(supabaseUrl)
          ? 'VITE_SUPABASE_URL is invalid. Use the project URL beginning with https:// from Supabase → Project Settings → API.'
          : !adminUserId || !isUuid(adminUserId)
            ? 'VITE_ADMIN_USER_ID is missing or is not a valid Supabase user UUID.'
            : ''
    ),
    loading,
    saveError,
    saveContent,
    uploadAsset,
  }), [content, loading, saveError, saveContent, uploadAsset])

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio() {
  const value = useContext(PortfolioContext)
  if (!value) throw new Error('usePortfolio must be used within PortfolioProvider.')
  return value
}
