import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import { COLORS } from '@/lib/brand'
import type { WorksheetDocument } from './content'

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 54
const FOOTER_H = 44
const BODY = 10.5
const GAP = 4
const MIN_RULE = 110

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

export async function generateWorksheetPdf(doc: WorksheetDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(toWinAnsi(doc.title))
  pdf.setAuthor('Latimore Life & Legacy')
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const navy = hex(COLORS.navy)
  const gold = hex(COLORS.gold)
  const muted = hex(COLORS.textMuted)
  const text = hex(COLORS.text)
  const border = hex(COLORS.border)
  const pale = hex(COLORS.goldPale)
  const contentW = PAGE_W - MARGIN * 2
  const right = PAGE_W - MARGIN

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
    const lh = size + GAP
    for (const l of lines) {
      ensure(lh)
      page.drawText(l, { x, y: y - size, size, font: f, color })
      y -= lh
    }
  }

  newPage()
  drawLines(wrap(doc.title, bold, 22, contentW), bold, 22, navy, MARGIN)
  y -= 1
  drawLines(wrap(doc.subtitle, font, 12, contentW), font, 12, gold, MARGIN)
  y -= 4
  page.drawText(toWinAnsi('Name: '), { x: MARGIN, y: y - 10, size: 10, font: bold, color: navy })
  page.drawLine({ start: { x: MARGIN + 38, y: y - 12 }, end: { x: MARGIN + 290, y: y - 12 }, thickness: 0.6, color: muted })
  page.drawText('Date: ', { x: MARGIN + 310, y: y - 10, size: 10, font: bold, color: navy })
  page.drawLine({ start: { x: MARGIN + 340, y: y - 12 }, end: { x: right, y: y - 12 }, thickness: 0.6, color: muted })
  y -= 24

  for (const block of doc.blocks) {
    if (block.type === 'heading') {
      ensure(60)
      y -= 8
      drawLines(wrap(block.text, bold, 13, contentW), bold, 13, navy, MARGIN)
      page.drawLine({ start: { x: MARGIN, y: y + 1 }, end: { x: right, y: y + 1 }, thickness: 1, color: gold })
      y -= 6
    } else if (block.type === 'paragraph') {
      drawLines(wrap(block.text, font, BODY, contentW), font, BODY, text, MARGIN)
      y -= 5
    } else if (block.type === 'fields') {
      for (const item of block.items) {
        const lines = wrap(item, font, BODY, contentW)
        const lh = BODY + GAP
        ensure(lines.length * lh + 18)
        lines.forEach((l, i) => {
          page.drawText(l, { x: MARGIN, y: y - BODY, size: BODY, font, color: text })
          if (i === lines.length - 1) {
            const labelEnd = MARGIN + font.widthOfTextAtSize(l, BODY) + 8
            if (right - labelEnd >= MIN_RULE) {
              page.drawLine({ start: { x: labelEnd, y: y - BODY - 1.5 }, end: { x: right, y: y - BODY - 1.5 }, thickness: 0.6, color: muted })
            } else {
              y -= lh
              page.drawLine({ start: { x: MARGIN, y: y - BODY - 1.5 }, end: { x: right, y: y - BODY - 1.5 }, thickness: 0.6, color: muted })
            }
          }
          y -= lh
        })
        y -= 5
      }
    } else if (block.type === 'total') {
      ensure(34)
      y -= 3
      page.drawRectangle({ x: MARGIN, y: y - 24, width: contentW, height: 26, color: pale, borderColor: gold, borderWidth: 0.8 })
      const label = toWinAnsi(block.label)
      page.drawText(label, { x: MARGIN + 8, y: y - 16, size: BODY, font: bold, color: navy })
      const labelEnd = MARGIN + 8 + bold.widthOfTextAtSize(label, BODY) + 8
      page.drawLine({ start: { x: Math.min(labelEnd, right - 120), y: y - 18 }, end: { x: right - 8, y: y - 18 }, thickness: 0.8, color: navy })
      y -= 36
    } else if (block.type === 'checklist') {
      for (const item of block.items) {
        const lines = wrap(item, font, BODY, contentW - 22)
        const lh = BODY + GAP
        ensure(lines.length * lh + 4)
        page.drawRectangle({ x: MARGIN, y: y - BODY, width: 9, height: 9, borderColor: navy, borderWidth: 0.9 })
        drawLines(lines, font, BODY, text, MARGIN + 20)
        y -= 3
      }
      y -= 2
    } else if (block.type === 'bullets') {
      for (const item of block.items) {
        const lines = wrap(item, font, BODY, contentW - 16)
        ensure(BODY + GAP)
        page.drawText('-', { x: MARGIN + 2, y: y - BODY, size: BODY, font: bold, color: gold })
        drawLines(lines, font, BODY, text, MARGIN + 16)
        y -= 3
      }
    } else if (block.type === 'notes') {
      ensure(18 + block.lines * 20)
      y -= 6
      drawLines(wrap(block.label, bold, BODY, contentW), bold, BODY, navy, MARGIN)
      for (let i = 0; i < block.lines; i++) {
        y -= 18
        page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: 0.5, color: border })
      }
      y -= 10
    }
  }

  ensure(60)
  y -= 6
  drawLines(['Sources'], bold, 9, navy, MARGIN)
  for (const [title, url] of doc.sources) {
    drawLines(wrap(`${title}: ${url}`, font, 8.5, contentW), font, 8.5, muted, MARGIN)
  }

  const pages = pdf.getPages()
  const footerLines = wrap(doc.footer, font, 7.5, contentW - 70)
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: MARGIN, y: MARGIN + 30 }, end: { x: right, y: MARGIN + 30 }, thickness: 0.5, color: border })
    footerLines.forEach((l, j) => p.drawText(l, { x: MARGIN, y: MARGIN + 18 - j * 10, size: 7.5, font, color: muted }))
    const label = `Page ${i + 1} of ${pages.length}`
    p.drawText(label, { x: right - font.widthOfTextAtSize(label, 8), y: MARGIN + 18, size: 8, font, color: muted })
  })

  return pdf.save()
}
