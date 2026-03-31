import { RAW_RADAR_DATA } from './radar-data-source'
import { radarConfigSchema, type RadarConfigInput } from './radar-schemas'

// RADAR Score Configuration
export const DEFAULT_CONFIG = {
  weights: [0.2, 0.6, 1.0],
  posThresholds: [3, 10],
  scoreBands: [0.10, 0.30, 0.60],
  expectedCTR: {
    1: 39.8, 2: 18.7, 3: 10.2, 4: 7.2, 5: 5.1,
    6: 4.4, 7: 3.0, 8: 2.1, 9: 1.9, 10: 1.6,
    11: 1.0, 12: 0.8, 13: 0.7, 14: 0.6, 15: 0.5,
    16: 0.4, 17: 0.4, 18: 0.3, 19: 0.3, 20: 0.3
  } as Record<number, number>
}

export type RadarConfig = typeof DEFAULT_CONFIG

export interface RawTermData {
  term: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface EnrichedTermData extends RawTermData {
  score: number
  expCTR: number
  action: {
    type: 'avoid' | 'evaluate' | 'test' | 'invest'
    label: string
    description: string
  }
}

export interface ClusterMetrics {
  terms: EnrichedTermData[]
  totalClicks: number
  totalImpressions: number
  avgPosition: number
  avgCTR: number
  avgExpectedCTR: number
  avgScore: number
  action: EnrichedTermData['action']
}

export function validateRadarConfig(config: RadarConfigInput): RadarConfig {
  const normalizedExpectedCTR = Object.fromEntries(
    Array.from({ length: 20 }, (_, index) => {
      const position = index + 1
      const currentValue =
        config.expectedCTR[position] ??
        config.expectedCTR[String(position)] ??
        DEFAULT_CONFIG.expectedCTR[position]

      return [String(position), Number(currentValue)]
    })
  )

  const parsed = radarConfigSchema.parse({
    weights: config.weights,
    posThresholds: config.posThresholds,
    scoreBands: config.scoreBands,
    expectedCTR: normalizedExpectedCTR,
  })

  return {
    weights: [...parsed.weights] as RadarConfig['weights'],
    posThresholds: [...parsed.posThresholds] as RadarConfig['posThresholds'],
    scoreBands: [...parsed.scoreBands] as RadarConfig['scoreBands'],
    expectedCTR: Object.fromEntries(
      Object.entries(parsed.expectedCTR).map(([key, value]) => [Number(key), value])
    ) as RadarConfig['expectedCTR'],
  }
}

export function isRadarConfigValid(config: RadarConfigInput): boolean {
  const normalizedExpectedCTR = Object.fromEntries(
    Array.from({ length: 20 }, (_, index) => {
      const position = index + 1
      const currentValue =
        config.expectedCTR[position] ??
        config.expectedCTR[String(position)] ??
        DEFAULT_CONFIG.expectedCTR[position]

      return [String(position), Number(currentValue)]
    })
  )

  return radarConfigSchema.safeParse({
    weights: config.weights,
    posThresholds: config.posThresholds,
    scoreBands: config.scoreBands,
    expectedCTR: normalizedExpectedCTR,
  }).success
}

export function sanitizeRadarConfig(config: Partial<RadarConfigInput> | null | undefined): RadarConfig {
  if (!config) {
    return DEFAULT_CONFIG
  }

  try {
    return validateRadarConfig({
      weights: (config.weights ?? DEFAULT_CONFIG.weights) as RadarConfigInput['weights'],
      posThresholds: (config.posThresholds ?? DEFAULT_CONFIG.posThresholds) as RadarConfigInput['posThresholds'],
      scoreBands: (config.scoreBands ?? DEFAULT_CONFIG.scoreBands) as RadarConfigInput['scoreBands'],
      expectedCTR: {
        ...DEFAULT_CONFIG.expectedCTR,
        ...(config.expectedCTR ?? {}),
      },
    })
  } catch {
    return DEFAULT_CONFIG
  }
}

export const DASHBOARD_DATE_RANGES = [
  {
    key: '7d',
    label: '7 dias',
    shortLabel: '7D',
    description: 'Leitura curta para movimentos recentes',
    days: 7,
    demandFactor: 0.82,
    volatility: 0.22,
    ctrDrift: -0.025,
    positionDrift: 0.18,
  },
  {
    key: '30d',
    label: '30 dias',
    shortLabel: '30D',
    description: 'Janela equilibrada para leitura operacional',
    days: 30,
    demandFactor: 0.92,
    volatility: 0.14,
    ctrDrift: -0.01,
    positionDrift: 0.08,
  },
  {
    key: '90d',
    label: '90 dias',
    shortLabel: '90D',
    description: 'Base principal consolidada do RADAR',
    days: 90,
    demandFactor: 1,
    volatility: 0,
    ctrDrift: 0,
    positionDrift: 0,
  },
  {
    key: '180d',
    label: '180 dias',
    shortLabel: '6M',
    description: 'Contexto mais estavel para sazonalidade',
    days: 180,
    demandFactor: 1.08,
    volatility: 0.08,
    ctrDrift: 0.012,
    positionDrift: -0.05,
  },
  {
    key: '365d',
    label: '12 meses',
    shortLabel: '12M',
    description: 'Visao ampla para tendencia anual',
    days: 365,
    demandFactor: 1.16,
    volatility: 0.12,
    ctrDrift: 0.025,
    positionDrift: -0.1,
  },
] as const

export type DashboardDateRangeKey = (typeof DASHBOARD_DATE_RANGES)[number]['key']

const BASE_PERIOD_DAYS = 90

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getStableTermSignal(term: string): number {
  let hash = 0

  for (let index = 0; index < term.length; index += 1) {
    hash = (hash * 31 + term.charCodeAt(index)) % 1000003
  }

  return (hash % 1000) / 1000
}

export function getDashboardDateRange(range: DashboardDateRangeKey) {
  return DASHBOARD_DATE_RANGES.find((option) => option.key === range) ?? DASHBOARD_DATE_RANGES[2]
}

// Calculation functions
export function getExpCTR(position: number, config: RadarConfig = DEFAULT_CONFIG): number {
  const p = Math.round(Math.min(Math.max(position, 1), 20))
  return config.expectedCTR[p] || 0.3
}

export function getWeight(position: number, config: RadarConfig = DEFAULT_CONFIG): number {
  if (position <= config.posThresholds[0]) return config.weights[0]
  if (position <= config.posThresholds[1]) return config.weights[1]
  return config.weights[2]
}

export function calcScore(ctr: number, position: number, config: RadarConfig = DEFAULT_CONFIG): number {
  const expCTR = getExpCTR(position, config)
  const weight = getWeight(position, config)
  return Math.max(0, Math.min(1, weight * (1 - (ctr / expCTR))))
}

export function getScoreAction(score: number, config: RadarConfig = DEFAULT_CONFIG): EnrichedTermData['action'] {
  const [b1, b2, b3] = config.scoreBands
  if (score <= b1) return { type: 'avoid', label: 'Evitar', description: 'Orgânico forte. Investimento desnecessário.' }
  if (score <= b2) return { type: 'evaluate', label: 'Avaliar', description: 'Boa posição, CTR abaixo. Avaliar reforço.' }
  if (score <= b3) return { type: 'test', label: 'Testar', description: 'Testar campanhas + ajustar orgânico.' }
  return { type: 'invest', label: 'Investir', description: 'Baixa visibilidade. Forte oportunidade.' }
}

export function getScoreColor(score: number, config: RadarConfig = DEFAULT_CONFIG): string {
  const [b1, b2, b3] = config.scoreBands
  if (score <= b1) return '#10B981' // emerald - avoid
  if (score <= b2) return '#6366F1' // indigo - evaluate
  if (score <= b3) return '#F59E0B' // amber - test
  return '#EF4444' // red - invest
}

export function getScoreLabel(score: number, config: RadarConfig = DEFAULT_CONFIG): string {
  const [b1, b2, b3] = config.scoreBands
  if (score <= b1) return 'Evitar'
  if (score <= b2) return 'Avaliar'
  if (score <= b3) return 'Testar'
  return 'Investir'
}

export function enrichTermData(data: RawTermData[], config: RadarConfig = DEFAULT_CONFIG): EnrichedTermData[] {
  return data.map(d => {
    const score = calcScore(d.ctr, d.position, config)
    const expCTR = getExpCTR(d.position, config)
    const action = getScoreAction(score, config)
    return { ...d, score, expCTR, action }
  }).sort((a, b) => b.score - a.score)
}

export function getRelatedTerms(
  selectedTerm: EnrichedTermData,
  allTerms: EnrichedTermData[],
  maxRelated: number = 12
): EnrichedTermData[] {
  const selectedWords = selectedTerm.term.toLowerCase().split(/\s+/)

  return allTerms
    .filter((term) => term.term !== selectedTerm.term)
    .map((term) => {
      const termWords = term.term.toLowerCase().split(/\s+/)
      const commonWords = selectedWords.filter((word) =>
        termWords.some((termWord) => termWord.includes(word) || word.includes(termWord))
      ).length
      const scoreDiff = Math.abs(term.score - selectedTerm.score)
      const similarity = commonWords * 10 + (100 - scoreDiff) / 10

      return { term, similarity }
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxRelated)
    .map(({ term }) => term)
}

export function calculateClusterMetrics(
  selectedTerm: EnrichedTermData,
  allTerms: EnrichedTermData[],
  maxRelated: number = 12,
  config: RadarConfig = DEFAULT_CONFIG
): ClusterMetrics {
  const terms = [selectedTerm, ...getRelatedTerms(selectedTerm, allTerms, maxRelated)]
  const totalClicks = terms.reduce((sum, term) => sum + term.clicks, 0)
  const totalImpressions = terms.reduce((sum, term) => sum + term.impressions, 0)
  const totalWeight = totalImpressions || terms.length || 1

  const avgPosition =
    terms.reduce((sum, term) => sum + term.position * term.impressions, 0) / totalWeight
  const avgExpectedCTR =
    terms.reduce((sum, term) => sum + term.expCTR * term.impressions, 0) / totalWeight
  const avgScore =
    terms.reduce((sum, term) => sum + term.score * term.impressions, 0) / totalWeight
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  return {
    terms,
    totalClicks,
    totalImpressions,
    avgPosition,
    avgCTR,
    avgExpectedCTR,
    avgScore,
    action: getScoreAction(avgScore, config),
  }
}

// Source data imported from the complete GSC export
export const RADAR_DATA: RawTermData[] = RAW_RADAR_DATA

export function filterRadarDataByDateRange(
  data: RawTermData[],
  range: DashboardDateRangeKey
): RawTermData[] {
  const preset = getDashboardDateRange(range)

  if (preset.key === '90d') {
    return data
  }

  return data.map((term) => {
    const signal = getStableTermSignal(term.term)
    const directionalSignal = signal * 2 - 1
    const scaleBase = (preset.days / BASE_PERIOD_DAYS) * preset.demandFactor
    const volumeScale = clamp(scaleBase * (1 + directionalSignal * preset.volatility), 0.08, 4.8)
    const ctrScale = clamp(
      1 + preset.ctrDrift + directionalSignal * Math.max(preset.volatility * 0.45, 0.015),
      0.72,
      1.28
    )
    const scaledImpressions = Math.max(120, Math.round(term.impressions * volumeScale))
    const scaledClicks = Math.max(
      0,
      Math.min(
        scaledImpressions,
        Math.round(term.clicks * volumeScale * ctrScale)
      )
    )
    const ctr = scaledImpressions > 0 ? (scaledClicks / scaledImpressions) * 100 : 0
    const position = clamp(
      Number((term.position + preset.positionDrift + directionalSignal * Math.max(preset.volatility * 0.35, 0.02)).toFixed(2)),
      1,
      20
    )

    return {
      term: term.term,
      clicks: scaledClicks,
      impressions: scaledImpressions,
      ctr: Number(ctr.toFixed(2)),
      position,
    }
  })
}

// KPI Calculations
export function calculateKPIs(data: EnrichedTermData[]) {
  const totalTerms = data.length
  const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0)
  const totalImpressions = data.reduce((sum, d) => sum + d.impressions, 0)
  const avgPosition = data.reduce((sum, d) => sum + d.position, 0) / totalTerms
  const avgCTR = totalClicks / totalImpressions * 100
  
  const scoreDistribution = {
    avoid: data.filter(d => d.action.type === 'avoid').length,
    evaluate: data.filter(d => d.action.type === 'evaluate').length,
    test: data.filter(d => d.action.type === 'test').length,
    invest: data.filter(d => d.action.type === 'invest').length,
  }

  return {
    totalTerms,
    totalClicks,
    totalImpressions,
    avgPosition,
    avgCTR,
    scoreDistribution
  }
}

// Format helpers
export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
