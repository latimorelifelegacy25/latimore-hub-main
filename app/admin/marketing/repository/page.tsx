import { Newsreader, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'
import './repository.css'
import RepositoryApp from './_components/Dashboard'

export const metadata = {
  title: 'Content Repository | Latimore OS',
}

const newsreader = Newsreader({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--font-newsreader' })
const hanken = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-hanken' })
const jbmono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jbmono' })

export default function RepositoryPage() {
  return (
    <div className={`${newsreader.variable} ${hanken.variable} ${jbmono.variable}`}>
      <RepositoryApp />
    </div>
  )
}
