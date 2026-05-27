import type { Metadata } from 'next'
import BlogIndexClient from './BlogIndexClient'
import { getAllArticles } from '@/lib/mdx'

export const metadata: Metadata = {
  title: 'Blog — Financial Education for Coal Region Families',
  description:
    'Plain-language guides on life insurance, retirement planning, and leaving a legacy — written by Jackson Latimore, independent broker and cardiac arrest survivor.',
  openGraph: {
    title: 'Blog | Latimore Life & Legacy',
    description:
      'Real talk on life insurance, retirement, and leaving something behind. Written for Coal Region PA families.',
    type: 'website',
  },
}

export default function BlogPage() {
  const articles = getAllArticles()
  return <BlogIndexClient articles={articles} />
}
