export type ProjectCategory = 'Web Development' | 'Library Technology' | 'Business / Entrepreneurship'

export type Project = {
  slug: string
  name: string
  eyebrow: string
  description: string
  overview: string
  problem: string
  solution: string
  features: string[]
  category: ProjectCategory
  technologies: string[]
  number: string
  tone: string
  imageUrl?: string
  liveUrl?: string
  githubUrl?: string
}

export type TimelineItem = {
  type: string
  title: string
  organisation: string
  date: string
  description: string
  imageUrl?: string
}

export type GalleryItem = {
  title: string
  description: string
  imageUrl: string
}

export const projects: Project[] = [
  {
    slug: 'smartlibrary-ai',
    name: 'smartLibrary Ai',
    eyebrow: 'Knowledge, catalogued',
    description: 'An AI-powered assistant concept for faster cataloguing, classification suggestions, and digital accession records.',
    overview: 'smartLibrary Ai is a concept for helping library teams organise bibliographic information and keep digital accession records together.',
    problem: 'Manual cataloguing can make routine data entry and classification work time-consuming for library professionals.',
    solution: 'A focused assistant experience designed to support cataloguing workflows with suggested data and a clear record-keeping process.',
    features: ['Bibliographic data entry assistance', 'DDC classification suggestions', 'Digital accession record management'],
    category: 'Library Technology',
    technologies: ['Project concept', 'Library and Information Science'],
    number: '01',
    tone: 'lime',
  },
  {
    slug: 'waste-scheduler',
    name: 'WasteScheduler',
    eyebrow: 'A cleaner way forward',
    description: 'A waste management platform concept connecting residents, collectors, businesses, and administrators.',
    overview: 'WasteScheduler brings the key participants in local waste collection into one proposed scheduling and reporting experience.',
    problem: 'Coordinating collection, records, and communication across multiple stakeholders can be fragmented.',
    solution: 'A shared platform concept for scheduling pickups, maintaining records, and supporting clear operational reporting.',
    features: ['Collection scheduling', 'Stakeholder coordination', 'Records and reporting'],
    category: 'Web Development',
    technologies: ['Project concept', 'Platform design'],
    number: '02',
    tone: 'blue',
  },
  {
    slug: 'dynamore',
    name: 'DYNAMORE',
    eyebrow: 'Many services. One ambition.',
    description: 'A business umbrella for sports products, laundry services, and digital airtime and data services.',
    overview: 'DYNAMORE is a multi-service business initiative bringing together practical everyday offerings under a single identity.',
    problem: 'Customers often need to navigate separate providers for everyday services and products.',
    solution: 'An adaptable business umbrella organised around sports products, laundry, and digital airtime and data.',
    features: ['Sports products', 'Laundry services', 'Digital airtime and data'],
    category: 'Business / Entrepreneurship',
    technologies: ['Business initiative'],
    number: '03',
    tone: 'violet',
  },
]

export const skills = [
  { title: 'Frontend Development', items: ['React', 'TypeScript', 'HTML & CSS'], icon: 'code' },
  { title: 'Backend Development', items: ['Add technologies you use'], icon: 'server' },
  { title: 'Database Management', items: ['Add databases you use'], icon: 'database' },
  { title: 'Library & Information Science', items: ['Cataloguing', 'Classification', 'Knowledge organisation'], icon: 'book' },
  { title: 'Digital Tools', items: ['Add tools you use'], icon: 'sparkles' },
  { title: 'Professional Skills', items: ['Entrepreneurship', 'Communication', 'Continuous learning'], icon: 'users' },
]

export const timeline: TimelineItem[] = [
  { type: 'Education', title: 'Library and Information Science', organisation: 'Add institution name', date: 'Add dates', description: 'Add a short description of your studies and relevant focus areas.' },
  { type: 'Experience', title: 'Professional experience', organisation: 'Add organisation or role', date: 'Add dates', description: 'Add responsibilities, outcomes, and the context for this role.' },
  { type: 'Certification', title: 'Certifications & achievements', organisation: 'Add provider or issuing organisation', date: 'Add dates', description: 'Add verified certifications, awards, or achievements.' },
]

export const socialLinks = [
  { label: 'LinkedIn', href: '', short: 'in' },
  { label: 'GitHub', href: '', short: 'gh' },
  { label: 'Email', href: '', short: '@' },
  { label: 'WhatsApp', href: '', short: 'wa' },
  { label: 'Facebook', href: '', short: 'f' },
  { label: 'TikTok', href: '', short: '♪' },
]

export const contactEmail = ''
export const gallery: GalleryItem[] = []

export const professionalRoles = ['Software Engineer', 'Library & Information Science Professional', 'Entrepreneur']

export type PortfolioContent = {
  bio: string
  professionalRoles: string[]
  projects: Project[]
  skills: typeof skills
  timeline: TimelineItem[]
  socialLinks: typeof socialLinks
  gallery: GalleryItem[]
  contactEmail: string
  portraitUrl: string
  portraitUrls: string[]
  cvUrl: string
}

export const initialPortfolioContent: PortfolioContent = {
  bio: 'I build digital solutions, organise knowledge, and create opportunities through technology.',
  professionalRoles,
  projects,
  skills,
  timeline,
  socialLinks,
  gallery,
  contactEmail,
  portraitUrl: '',
  portraitUrls: [],
  cvUrl: '',
}
