import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'

export type Track = 'A' | 'B' | 'C'

export interface ArticleMeta {
  slug: string
  title: string
  track: Track
  trackLabel: string
  num: string
  excerpt: string
  format: string
  kpi: string
  cta: string
  bilingual?: boolean
  publishedAt: string
  readingTime?: number // minutes
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog')

/** Estimate reading time in minutes from raw markdown content. */
function calcReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / 200) // 200 wpm average
}

/** Return all article metadata sorted by article number (A1, A2, …, C4). */
export function getAllArticles(): ArticleMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return []

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.mdx'))

  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, '')
      const filePath = path.join(CONTENT_DIR, filename)
      const raw = fs.readFileSync(filePath, 'utf-8')
      const { data, content } = matter(raw)
      return {
        slug,
        ...(data as Omit<ArticleMeta, 'slug'>),
        readingTime: calcReadingTime(content),
      } as ArticleMeta
    })
    .sort((a, b) => a.num.localeCompare(b.num))
}

/** Return a single article's metadata + raw MDX content for rendering. */
export async function getArticleBySlug(
  slug: string
): Promise<{ meta: ArticleMeta; content: string } | null> {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  const meta: ArticleMeta = {
    slug,
    ...(data as Omit<ArticleMeta, 'slug'>),
    readingTime: calcReadingTime(content),
  }

  return { meta, content }
}

/**
 * Convert raw markdown content to an HTML string.
 * Uses `marked` (GFM-enabled by default) — no RSC React dependency.
 */
export async function renderMarkdown(content: string): Promise<string> {
  return marked(content, { gfm: true, breaks: false }) as string
}

/** Return all slugs — used to pre-generate static pages. */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''))
}
