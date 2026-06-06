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
  kpi?: string
  cta?: string
  bilingual?: boolean
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

export function getPostSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''))
}

export function getPostBySlug(slug: string): Post {
  const fullPath = path.join(CONTENT_DIR, `${slug}.mdx`)
  const raw = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(raw)
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
