import { rawTermDataSchema, type RawTermDataInput } from './radar-schemas'

export interface RadarImportIssue {
  row: number
  field: string
  message: string
  value?: string
}

export interface RadarImportWarning {
  code: 'duplicate-term'
  message: string
  detail?: string
}

export interface RadarImportSummary {
  rowCount: number
  importedCount: number
  duplicateCount: number
  delimiter: string
  headers: string[]
}

export interface RadarImportResult {
  success: boolean
  label: string
  data: RawTermDataInput[]
  summary: RadarImportSummary
  issues: RadarImportIssue[]
  warnings: RadarImportWarning[]
}

const HEADER_ALIASES: Record<string, keyof RawTermDataInput> = {
  termo: 'term',
  term: 'term',
  keyword: 'term',
  consulta: 'term',
  cliques: 'clicks',
  clicks: 'clicks',
  click: 'clicks',
  impressoes: 'impressions',
  impressões: 'impressions',
  impressions: 'impressions',
  imp: 'impressions',
  ctr: 'ctr',
  'ctr real': 'ctr',
  'ctr %': 'ctr',
  ctrpercent: 'ctr',
  posicao: 'position',
  posição: 'position',
  position: 'position',
  pos: 'position',
  ranking: 'position',
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeHeader(value: string): string {
  return slugify(value).replace(/-/g, ' ')
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? ''
  const candidates = [',', ';', '\t']

  return candidates
    .map((delimiter) => ({ delimiter, score: firstLine.split(delimiter).length }))
    .sort((a, b) => b.score - a.score)[0]?.delimiter ?? ','
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values.map((value) => value.replace(/^"|"$/g, '').trim())
}

function normalizeNumber(value: string | undefined): number | null {
  if (!value) return null

  const sanitized = value
    .trim()
    .replace(/%/g, '')
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')

  const parsed = Number(sanitized)
  return Number.isFinite(parsed) ? parsed : null
}

function buildColumnMap(headers: string[]): Partial<Record<keyof RawTermDataInput, number>> {
  return headers.reduce<Partial<Record<keyof RawTermDataInput, number>>>((map, header, index) => {
    const canonical = HEADER_ALIASES[normalizeHeader(header)]
    if (canonical && map[canonical] === undefined) {
      map[canonical] = index
    }
    return map
  }, {})
}

function buildSourceLabel(filename?: string, label?: string): string {
  if (label?.trim()) return label.trim()
  if (!filename) return 'Importacao manual'
  return filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Importacao manual'
}

function aggregateDuplicateTerms(data: RawTermDataInput[]) {
  const grouped = new Map<string, RawTermDataInput[]>()

  for (const row of data) {
    const key = row.term.toLowerCase()
    const bucket = grouped.get(key) ?? []
    bucket.push(row)
    grouped.set(key, bucket)
  }

  const merged = [...grouped.values()].map((rows) => {
    if (rows.length === 1) return rows[0]

    const clicks = rows.reduce((sum, row) => sum + row.clicks, 0)
    const impressions = rows.reduce((sum, row) => sum + row.impressions, 0)
    const weightedBase = rows.reduce((sum, row) => sum + Math.max(row.impressions, 1), 0)
    const position =
      rows.reduce((sum, row) => sum + row.position * Math.max(row.impressions, 1), 0) / weightedBase

    return rawTermDataSchema.parse({
      term: rows[0].term,
      clicks,
      impressions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      position,
    })
  })

  const duplicateCount = [...grouped.values()].reduce((sum, rows) => sum + Math.max(rows.length - 1, 0), 0)
  return { merged, duplicateCount }
}

export function parseRadarImportText(
  text: string,
  options: { filename?: string; label?: string } = {}
): RadarImportResult {
  const delimiter = detectDelimiter(text)
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const label = buildSourceLabel(options.filename, options.label)

  if (lines.length < 2) {
    return {
      success: false,
      label,
      data: [],
      summary: { rowCount: 0, importedCount: 0, duplicateCount: 0, delimiter, headers: [] },
      issues: [{ row: 0, field: 'file', message: 'Arquivo sem linhas suficientes para importar' }],
      warnings: [],
    }
  }

  const headers = parseCsvLine(lines[0], delimiter)
  const columnMap = buildColumnMap(headers)
  const issues: RadarImportIssue[] = []
  const warnings: RadarImportWarning[] = []
  const parsedRows: RawTermDataInput[] = []

  for (const field of ['term', 'clicks', 'impressions', 'position'] as const) {
    if (columnMap[field] === undefined) {
      issues.push({ row: 1, field, message: `Coluna obrigatoria ausente: ${field}` })
    }
  }

  if (issues.length > 0) {
    return {
      success: false,
      label,
      data: [],
      summary: { rowCount: lines.length - 1, importedCount: 0, duplicateCount: 0, delimiter, headers },
      issues,
      warnings,
    }
  }

  for (let index = 1; index < lines.length; index += 1) {
    const rowNumber = index + 1
    const values = parseCsvLine(lines[index], delimiter)
    const term = values[columnMap.term!]?.trim()
    const clicks = normalizeNumber(values[columnMap.clicks!])
    const impressions = normalizeNumber(values[columnMap.impressions!])
    const ctr = columnMap.ctr !== undefined ? normalizeNumber(values[columnMap.ctr]) : null
    const position = normalizeNumber(values[columnMap.position!])

    if (!term) {
      issues.push({ row: rowNumber, field: 'term', message: 'Termo vazio' })
      continue
    }
    if (clicks === null) {
      issues.push({ row: rowNumber, field: 'clicks', message: 'Cliques invalido', value: values[columnMap.clicks!] })
      continue
    }
    if (impressions === null) {
      issues.push({
        row: rowNumber,
        field: 'impressions',
        message: 'Impressoes invalido',
        value: values[columnMap.impressions!],
      })
      continue
    }
    if (position === null) {
      issues.push({
        row: rowNumber,
        field: 'position',
        message: 'Posicao invalida',
        value: values[columnMap.position!],
      })
      continue
    }

    const safeCtr = ctr ?? (impressions > 0 ? (clicks / impressions) * 100 : 0)
    const parsed = rawTermDataSchema.safeParse({
      term,
      clicks,
      impressions,
      ctr: safeCtr,
      position,
    })

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      issues.push({
        row: rowNumber,
        field: String(firstIssue.path[0] ?? 'row'),
        message: firstIssue.message,
      })
      continue
    }

    parsedRows.push(parsed.data)
  }

  const { merged, duplicateCount } = aggregateDuplicateTerms(parsedRows)

  if (duplicateCount > 0) {
    warnings.push({
      code: 'duplicate-term',
      message: `${duplicateCount} linha(s) duplicadas foram consolidadas por termo`,
    })
  }

  return {
    success: issues.length === 0 && merged.length > 0,
    label,
    data: merged,
    summary: {
      rowCount: lines.length - 1,
      importedCount: merged.length,
      duplicateCount,
      delimiter,
      headers,
    },
    issues,
    warnings,
  }
}

export async function parseRadarImportFile(
  file: File,
  options: { label?: string } = {}
): Promise<RadarImportResult> {
  const text = await file.text()
  return parseRadarImportText(text, {
    filename: file.name,
    label: options.label,
  })
}
