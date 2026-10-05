import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import { COLORS } from '@/lib/brand'
import type { GuideDocument } from './content'

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 54
const FOOTER_H = 40
const BODY_SIZE = 11
const LINE_GAP = 4

function hex(color: string): RGB {
  const n = parseInt(color.replace('#', ''), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/** Standard PDF fonts only cover WinAnsi; normalise common typographic characters. */
function toWinAnsi(value: string): string {
  return value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA1-\xFF\n]/g, '')
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of toWinAnsi(text).split(/\s+/).filter(Boolean)) {
    let w = word
    // Break words that are wider than a full line (long URLs).
    while (font.widthOfTextAtSize(w, size) > maxWidth) {
      let cut = w.length - 1
      while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > maxWidth) cut--
      if (line) {
        lines.push(line)
        line = ''
      }
      lines.push(w.slice(0, cut))
      w = w.slice(cut)
    }
    const candidate = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate
    else {
      if (line) lines.push(line)
      line = w
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function generateGuidePdf(guide: GuideDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(toWinAnsi(guide.title))
  pdf.setAuthor('Latimore Life & Legacy')
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const navy = hex(COLORS.navy)
  const gold = hex(COLORS.gold)
  const muted = hex(COLORS.textMuted)
  const text = hex(COLORS.text)
  const contentW = PAGE_W - MARGIN * 2

  let page!: PDFPage
  let y = 0

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H])
    page.drawRectangle({ x: 0, y: PAGE_H - 10, width: PAGE_W, height: 10, color: navy })
    page.drawRectangle({ x: 0, y: PAGE_H - 13, width: PAGE_W, height: 3, color: gold })
    y = PAGE_H - MARGIN - 8
  }
  const ensure = (needed: number) => {
    if (y - needed < MARGIN + FOOTER_H) newPage()
  }

  const drawLines = (lines: string[], f: PDFFont, size: number, color: RGB, x: number) => {
    const lh = size + LINE_GAP
    for (const l of lines) {
      ensure(lh)
      page.drawText(l, { x, y: y - size, size, font: f, color })
      y -= lh
    }
  }

  newPage()
  drawLines(wrap(guide.title, bold, 24, contentW), bold, 24, navy, MARGIN)
  y -= 2
  drawLines(wrap(guide.subtitle, font, 12, contentW), font, 12, gold, MARGIN)
  y -= 14

  for (const section of guide.sections) {
    const headLines = wrap(section.heading, bold, 14, contentW)
    // Keep a heading with at least its first couple of lines.
    ensure(headLines.length * 18 + 40)
    y -= 8
    drawLines(headLines, bold, 14, navy, MARGIN)
    y -= 4
    for (const p of section.paragraphs ?? []) {
      drawLines(wrap(p, font, BODY_SIZE, contentW), font, BODY_SIZE, text, MARGIN)
      y -= 6
    }
    for (const b of section.bullets ?? []) {
      const lines = wrap(b, font, BODY_SIZE, contentW - 16)
      ensure(BODY_SIZE + LINE_GAP)
      page.drawText('-', { x: MARGIN + 2, y: y - BODY_SIZE, size: BODY_SIZE, font: bold, color: gold })
      drawLines(lines, font, BODY_SIZE, text, MARGIN + 16)
      y -= 3
    }
  }

  const pages = pdf.getPages()
  const footer = toWinAnsi(guide.footer)
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: MARGIN, y: MARGIN + 22 }, end: { x: PAGE_W - MARGIN, y: MARGIN + 22 }, thickness: 0.5, color: hex(COLORS.border) })
    p.drawText(footer, { x: MARGIN, y: MARGIN + 8, size: 8, font, color: muted })
    const label = `Page ${i + 1} of ${pages.length}`
    p.drawText(label, { x: PAGE_W - MARGIN - font.widthOfTextAtSize(label, 8), y: MARGIN + 8, size: 8, font, color: muted })
  })

  return pdf.save()
}
