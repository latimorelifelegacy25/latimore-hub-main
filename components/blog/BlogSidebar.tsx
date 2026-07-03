import Link from 'next/link'
import BlogCTA from './BlogCTA'
import NewsletterSignup from './NewsletterSignup'
import { getAllPosts } from '@/lib/blog'

interface Props {
  categories: string[]
  currentCategory?: string
  currentTag?: string
}

export default function BlogSidebar({ categories, currentCategory, currentTag }: Props) {
  const allPosts = getAllPosts()

  // Count posts per category
  const counts: Record<string, number> = {}
  for (const post of allPosts) {
    counts[post.category] = (counts[post.category] ?? 0) + 1
  }

  return (
    <aside className="blog-sidebar">
      {/* Categories */}
      <div className="blog-sidebar__card">
        <h3>Browse Topics</h3>
        <ul className="sidebar-category-list">
          <li>
            <Link
              href="/education/blog"
              className={!currentCategory && !currentTag ? 'active' : ''}
            >
              <span>All Articles</span>
              <span className="sidebar-category-list__count">{allPosts.length}</span>
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat}>
              <Link
                href={`/education/blog?category=${encodeURIComponent(cat)}`}
                className={currentCategory === cat ? 'active' : ''}
              >
                <span>{cat}</span>
                <span className="sidebar-category-list__count">{counts[cat] ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <BlogCTA />

      {/* Newsletter signup — captured into the CRM via /api/lead */}
      <div className="blog-sidebar__card">
        <h3>Stay Informed</h3>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem', lineHeight: 1.6 }}>
          Get plain-language financial insights delivered to your inbox. No spam — ever.
        </p>
        <NewsletterSignup />
      </div>
    </aside>
  )
}
