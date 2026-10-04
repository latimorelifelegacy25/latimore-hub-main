'use client'

import { forwardRef, useEffect, useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'

interface FlipbookViewerProps {
  url: string
  title?: string
  onClose: () => void
}

const PAGE_WIDTH = 420
const MAX_PAGES = 120

const Page = forwardRef<HTMLDivElement, { src: string; number: number }>(function Page({ src, number }, ref) {
  return (
    <div ref={ref} className="bg-white shadow-inner">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Page ${number}`} className="w-full h-full object-contain select-none" draggable={false} />
    </div>
  )
})

export default function FlipbookViewer({ url, title, onClose }: FlipbookViewerProps) {
  const [pages, setPages] = useState<string[]>([])
  const [ratio, setRatio] = useState(1.294)
  const [current, setCurrent] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [progress, setProgress] = useState('')
  const bookRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
        const pdf = await pdfjs.getDocument({ url }).promise
        const total = Math.min(pdf.numPages, MAX_PAGES)
        const rendered: string[] = []
        for (let i = 1; i <= total; i++) {
          if (cancelled) return
          setProgress(`Rendering page ${i} of ${total}`)
          const page = await pdf.getPage(i)
          const base = page.getViewport({ scale: 1 })
          if (i === 1) setRatio(base.height / base.width)
          const viewport = page.getViewport({ scale: (PAGE_WIDTH * 2) / base.width })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas unavailable')
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
          rendered.push(canvas.toDataURL('image/jpeg', 0.85))
        }
        if (cancelled) return
        setPages(rendered)
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => { cancelled = true }
  }, [url])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') bookRef.current?.pageFlip()?.flipNext()
      if (e.key === 'ArrowLeft') bookRef.current?.pageFlip()?.flipPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl flex items-center justify-between text-white mb-4">
        <h2 className="font-black text-sm truncate">{title || 'Flipbook'}</h2>
        <button onClick={onClose} aria-label="Close flipbook" className="text-xl text-slate-300 hover:text-white">✕</button>
      </div>

      {status === 'loading' && <p className="text-slate-300 text-sm font-bold">{progress || 'Loading PDF…'}</p>}
      {status === 'error' && (
        <p className="text-red-300 text-sm font-bold">
          Couldn&apos;t load this PDF. Check that the link is a direct PDF and allows cross-origin access.
        </p>
      )}

      {status === 'ready' && (
        <>
          <HTMLFlipBook
            ref={bookRef}
            width={PAGE_WIDTH}
            height={Math.round(PAGE_WIDTH * ratio)}
            size="stretch"
            minWidth={280}
            maxWidth={640}
            minHeight={360}
            maxHeight={900}
            showCover
            maxShadowOpacity={0.5}
            mobileScrollSupport
            onFlip={(e: { data: number }) => setCurrent(e.data)}
            className=""
            style={{}}
            startPage={0}
            drawShadow
            flippingTime={700}
            usePortrait
            startZIndex={0}
            autoSize
            clickEventForward
            useMouseEvents
            swipeDistance={30}
            showPageCorners
            disableFlipByClick={false}
          >
            {pages.map((src, i) => <Page key={i} src={src} number={i + 1} />)}
          </HTMLFlipBook>
          <div className="mt-4 flex items-center gap-4 text-white text-xs font-black uppercase tracking-widest">
            <button onClick={() => bookRef.current?.pageFlip()?.flipPrev()} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#C9A25F] transition-all">← Prev</button>
            <span>Page {current + 1} / {pages.length}</span>
            <button onClick={() => bookRef.current?.pageFlip()?.flipNext()} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#C9A25F] transition-all">Next →</button>
          </div>
        </>
      )}
    </div>
  )
}
