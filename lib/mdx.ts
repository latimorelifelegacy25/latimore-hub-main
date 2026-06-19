import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

const CONTENT_DIR = path.join(process.cwd(), 'content/blog')

export interface PostFrontmatter {
  title: string
  date: string
  excerpt: string
  category: string
  author: string
  featured?: boolean
  coverImage?: string
  track?: 'A' | 'B' | 'C'
  trackLabel?: string
  kpi?: string
  cta?: string
  bilingual?: boolean
  tags?: string[]
  description?: string
  publishedAt?: string
  format?: string
  num?: string
  draft?: boolean
}

export type Track = NonNullable<PostFrontmatter['track']>
export type ArticleMeta = Post & {
  track: Track
  trackLabel?: string
  num?: string
  format?: string
}

export interface Post extends PostFrontmatter {
  slug: string
  readingTime: string
  content: string
}

function isPublishablePost(slug: string, data: Partial<PostFrontmatter>) {
  const normalizedSlug = slug.toLowerCase()
  const title = typeof data.title === 'string' ? data.title.trim().toLowerCase() : ''

  if (!normalizedSlug) return false
  if (normalizedSlug.startsWith('_')) return false
  if (normalizedSlug.includes('template')) return false
  if (data.draft === true) return false
  if (!title) return false
  if (title.includes('your post title')) return false

  return true
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return []

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => fileName.replace(/\.mdx$/, ''))
    .filter((slug) => {
      try {
        const fullPath = path.join(CONTENT_DIR, `${slug}.mdx`)
        const raw = fs.readFileSync(fullPath, 'utf8')
        const { data } = matter(raw)
        return isPublishablePost(slug, data as Partial<PostFrontmatter>)
      } catch {
        return false
      }
    })
}

export function getPostBySlug(slug: string): Post {
  const fullPath = path.join(CONTENT_DIR, `${slug}.mdx`)
  const raw = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(raw)

  if (!isPublishablePost(slug, data as Partial<PostFrontmatter>)) {
    throw new Error(`Blog post is not publishable: ${slug}`)
  }

  const stats = readingTime(content)
  return {
    slug,
    ...(data as PostFrontmatter),
    readingTime: stats.text,
    content,
  }
}

export function getAllPosts(): Post[] {
  return getPostSlugs()
    .map((slug) => getPostBySlug(slug))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getFeaturedPost(): Post | undefined {
  return getAllPosts().find((p) => p.featured)
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter((p) => p.category === category)
}

export { CATEGORIES } from './blog-constants'
export type { Category } from './blog-constants'
