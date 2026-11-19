import type { Report, ReportRow } from './reports'

const pageWidth = 842
const pageHeight = 595
const margin = 36
const tableWidth = pageWidth - margin * 2
const rowHeight = 21
const tableBodyTop = 469
const rowBudget = tableBodyTop - 42 - rowHeight
const cellFontSize = 9
const cellLineHeight = 11
const windowsAnsi = new Map([
  ['€', 128], ['‘', 145], ['’', 146], ['“', 147], ['”', 148], ['•', 149],
  ['–', 150], ['—', 151], ['…', 133],
])

function pdfString(value: string) {
  const escaped = Array.from(value.normalize('NFC'), character => {
    const code = windowsAnsi.get(character) ?? character.charCodeAt(0)
    if (code >= 128 && code <= 255) return `\\${code.toString(8).padStart(3, '0')}`
    if (code < 32) return ' '
    if (code >= 127) return '?'
    return /[()\\]/.test(character) ? `\\${character}` : character
  }).join('')
  return `(${escaped})`
}

function label(value: string, x: number, y: number, size: number, bold = false, color = '0.10 0.14 0.23') {
  return `${color} rg BT /${bold ? 'Bold' : 'Regular'} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td ${pdfString(value)} Tj ET\n`
}

function background(x: number, y: number, width: number, height: number, color: string) {
  return `${color} rg ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f\n`
}

function approximateWidth(value: string, fontSize: number) {
  return Array.from(value).reduce((length, character) => {
    if (/[ilI.,:; !']/u.test(character)) return length + fontSize * 0.28
    if (/[MW@%]/u.test(character)) return length + fontSize * 0.9
    return length + fontSize * 0.56
  }, 0)
}

function wrapText(value: string, width: number) {
  const lines: string[] = []
  let line = ''
  for (const word of value.split(/\s+/u)) {
    const next = line ? `${line} ${word}` : word
    if (line && approximateWidth(next, cellFontSize) > width) {
      lines.push(line)
      line = ''
    }
    if (approximateWidth(word, cellFontSize) > width) {
      for (const character of word) {
        if (approximateWidth(line + character, cellFontSize) > width) {
          lines.push(line)
          line = ''
        }
        line += character
      }
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  lines.push(line)
  return lines
}

function tableRow(report: Report, values: string[]) {
  const columns = report.columns.map((column, index) => ({
    width: tableWidth * column.width / 100,
    align: column.align,
    lines: wrapText(values[index] ?? '', tableWidth * column.width / 100 - 14),
  }))
  const height = Math.max(rowHeight, ...columns.map(column => column.lines.length * cellLineHeight + 10))
  return { height, columns }
}

type TableRow = ReturnType<typeof tableRow>

function tableLine(row: TableRow, top: number, kind: 'heading' | 'body' | 'total', shaded: boolean) {
  const bg = kind === 'heading' ? '0.89 0.91 0.97' : kind === 'total' ? '0.93 0.94 0.98' : shaded ? '0.97 0.98 0.99' : '1 1 1'
  let content = background(margin, top - row.height, tableWidth, row.height, bg)
  let left = margin
  for (const column of row.columns) {
    column.lines.forEach((text, index) => {
      const right = left + column.width - 7
      const x = column.align === 'right' ? right - approximateWidth(text, cellFontSize) : left + 7
      content += label(text, x, top - 14 - index * cellLineHeight, cellFontSize, kind !== 'body')
    })
    left += column.width
  }
  return content
}

function renderPage(report: Report, rows: TableRow[], status: string, page: number, count: number, totals?: string[]) {
  let content = background(0, pageHeight - 6, pageWidth, 6, '0.27 0.24 0.66')
  content += label('Aurora Ops', margin, 556, 11, true, '0.27 0.24 0.66')
  content += label(report.name, margin, 529, 23, true)
  content += label(status ? `Situação: ${status}` : 'Todas as situações', margin, 508, 10, false, '0.35 0.39 0.47')
  content += tableLine(tableRow(report, report.columns.map(column => column.header)), 490, 'heading', false)
  let top = tableBodyTop
  rows.forEach((row, index) => {
    content += tableLine(row, top, 'body', index % 2 === 0)
    top -= row.height
  })
  if (totals && page === count) content += tableLine(tableRow(report, totals), top, 'total', true)
  content += label(`${page} / ${count}`, pageWidth - margin - 35, 22, 9, false, '0.35 0.39 0.47')
  return content
}

function paginateRows(report: Report, rows: ReportRow[]) {
  const result: TableRow[][] = [[]]
  let usedHeight = 0
  for (const row of rows) {
    const formatted = tableRow(report, row.cells.map(cell => cell.formatted || '—'))
    if (usedHeight && usedHeight + formatted.height > rowBudget) {
      result.push([])
      usedHeight = 0
    }
    result[result.length - 1]!.push(formatted)
    usedHeight += formatted.height
  }
  return result
}

export function reportPdf(report: Report, rows: ReportRow[], status: string, totals?: string[]) {
  const sheets = paginateRows(report, rows)
  const totalPages = sheets.length
  const pages: string[] = []
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ]

  sheets.forEach((sheet, index) => {
    const body = renderPage(report, sheet, status, index + 1, totalPages, totals)
    const pageId = objects.length + 1
    pages.push(`${pageId} 0 R`)
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /Regular 3 0 R /Bold 4 0 R >> >> /Contents ${pageId + 1} 0 R >>`,
      `<< /Length ${body.length} >>\nstream\n${body}endstream`,
    )
  })
  objects[1] = `<< /Type /Pages /Count ${totalPages} /Kids [${pages.join(' ')}] >>`

  let document = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((object, index) => {
    offsets.push(document.length)
    document += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const indexStart = document.length
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) document += `${String(offset).padStart(10, '0')} 00000 n \n`
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${indexStart}\n%%EOF\n`
  return new Blob([document], { type: 'application/pdf' })
}
