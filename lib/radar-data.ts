import { RAW_RADAR_DATA } from './radar-data-source'
import { radarConfigSchema } from './radar-schemas'

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
  clusterId?: number
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
  clusterId?: number
}

export interface ClusterInfo {
  clusterId: number
  terms: EnrichedTermData[]
  avgScore: number
  avgCTR: number
  totalImpressions: number
  totalClicks: number
  avgPosition: number
}

type RadarConfigLike = {
  weights: number[]
  posThresholds: number[]
  scoreBands: number[]
  expectedCTR: Record<number | string, number>
}

function normalizeRadarConfigShape(config: RadarConfigLike) {
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

  return {
    weights: [
      Number(config.weights[0] ?? DEFAULT_CONFIG.weights[0]),
      Number(config.weights[1] ?? DEFAULT_CONFIG.weights[1]),
      Number(config.weights[2] ?? DEFAULT_CONFIG.weights[2]),
    ] as [number, number, number],
    posThresholds: [
      Number(config.posThresholds[0] ?? DEFAULT_CONFIG.posThresholds[0]),
      Number(config.posThresholds[1] ?? DEFAULT_CONFIG.posThresholds[1]),
    ] as [number, number],
    scoreBands: [
      Number(config.scoreBands[0] ?? DEFAULT_CONFIG.scoreBands[0]),
      Number(config.scoreBands[1] ?? DEFAULT_CONFIG.scoreBands[1]),
      Number(config.scoreBands[2] ?? DEFAULT_CONFIG.scoreBands[2]),
    ] as [number, number, number],
    expectedCTR: normalizedExpectedCTR,
  }
}

export function validateRadarConfig(config: RadarConfigLike): RadarConfig {
  const normalizedConfig = normalizeRadarConfigShape(config)

  const parsed = radarConfigSchema.parse(normalizedConfig)

  return {
    weights: [...parsed.weights] as RadarConfig['weights'],
    posThresholds: [...parsed.posThresholds] as RadarConfig['posThresholds'],
    scoreBands: [...parsed.scoreBands] as RadarConfig['scoreBands'],
    expectedCTR: Object.fromEntries(
      Object.entries(parsed.expectedCTR).map(([key, value]) => [Number(key), value])
    ) as RadarConfig['expectedCTR'],
  }
}

export function isRadarConfigValid(config: RadarConfigLike): boolean {
  return radarConfigSchema.safeParse(normalizeRadarConfigShape(config)).success
}

export function sanitizeRadarConfig(config: Partial<RadarConfigLike> | null | undefined): RadarConfig {
  if (!config) {
    return DEFAULT_CONFIG
  }

  try {
    return validateRadarConfig({
      weights: config.weights ?? DEFAULT_CONFIG.weights,
      posThresholds: config.posThresholds ?? DEFAULT_CONFIG.posThresholds,
      scoreBands: config.scoreBands ?? DEFAULT_CONFIG.scoreBands,
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

// N-gram overlap calculation for semantic similarity
function getNgrams(str: string, n: number = 2): Set<string> {
  const normalized = str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
  const ngrams = new Set<string>()
  
  for (const word of normalized) {
    if (word.length < n) {
      ngrams.add(word)
      continue
    }
    for (let i = 0; i <= word.length - n; i++) {
      ngrams.add(word.slice(i, i + n))
    }
  }
  
  return ngrams
}

function calculateNgramOverlap(str1: string, str2: string, n: number = 2): number {
  const ngrams1 = getNgrams(str1, n)
  const ngrams2 = getNgrams(str2, n)
  
  if (ngrams1.size === 0 && ngrams2.size === 0) return 1
  if (ngrams1.size === 0 || ngrams2.size === 0) return 0
  
  let intersection = 0
  for (const gram of ngrams1) {
    if (ngrams2.has(gram)) intersection++
  }
  
  const union = ngrams1.size + ngrams2.size - intersection
  return union > 0 ? intersection / union : 0
}

// Levenshtein distance for edit distance calculation
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  
  if (m === 0) return n
  if (n === 0) return m
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }
  
  return dp[m][n]
}

function normalizeEditDistance(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1
  return 1 - levenshteinDistance(str1, str2) / maxLen
}

// Semantic similarity combining n-gram overlap and edit distance
function calculateSemanticSimilarity(term1: string, term2: string): number {
  const ngramOverlap = calculateNgramOverlap(term1, term2, 2)
  const editDistNorm = normalizeEditDistance(term1.toLowerCase(), term2.toLowerCase())
  
  // 70% n-gram overlap, 30% edit distance
  return ngramOverlap * 0.7 + editDistNorm * 0.3
}

export function enrichTermData(data: RawTermData[], config: RadarConfig = DEFAULT_CONFIG): EnrichedTermData[] {
  return data.map(d => {
    const score = calcScore(d.ctr, d.position, config)
    const expCTR = getExpCTR(d.position, config)
    const action = getScoreAction(score, config)
    return { ...d, score, expCTR, action }
  }).sort((a, b) => b.score - a.score)
}

// Assign cluster IDs to terms based on semantic similarity
export function assignClusterIds(
  terms: EnrichedTermData[],
  similarityThreshold: number = 0.4
): EnrichedTermData[] {
  const result = [...terms]
  const visited = new Set<number>()
  let clusterId = 1
  
  for (let i = 0; i < result.length; i++) {
    if (visited.has(i)) continue
    
    // Start a new cluster with this term
    visited.add(i)
    result[i].clusterId = clusterId
    
    // Find all semantically similar terms
    for (let j = i + 1; j < result.length; j++) {
      if (visited.has(j)) continue
      
      const similarity = calculateSemanticSimilarity(result[i].term, result[j].term)
      if (similarity >= similarityThreshold) {
        visited.add(j)
        result[j].clusterId = clusterId
      }
    }
    
    clusterId++
  }
  
  return result
}

// Get related clusters for a given term
export function getRelatedClusters(
  selectedTerm: EnrichedTermData,
  allTerms: EnrichedTermData[],
  maxClusters: number = 5
): Array<{ clusterId: number; terms: EnrichedTermData[]; avgScore: number; avgCTR: number }> {
  if (!selectedTerm.clusterId) return []
  
  const selectedClusterId = selectedTerm.clusterId
  
  // Group all terms by clusterId
  const clusterGroups = new Map<number, EnrichedTermData[]>()
  for (const term of allTerms) {
    if (term.clusterId === undefined) continue
    if (!clusterGroups.has(term.clusterId)) {
      clusterGroups.set(term.clusterId, [])
    }
    clusterGroups.get(term.clusterId)!.push(term)
  }
  
  // Calculate similarity between selected term's cluster and other clusters
  const clusterSimilarities: Array<{
    clusterId: number
    terms: EnrichedTermData[]
    avgScore: number
    avgCTR: number
    similarity: number
  }> = []
  
  for (const [cid, clusterTerms] of clusterGroups) {
    if (cid === selectedClusterId) continue
    
    // Calculate average semantic similarity between selected term and cluster terms
    let totalSimilarity = 0
    for (const term of clusterTerms) {
      totalSimilarity += calculateSemanticSimilarity(selectedTerm.term, term.term)
    }
    const avgSimilarity = totalSimilarity / clusterTerms.length
    
    const totalImpressions = clusterTerms.reduce((sum, t) => sum + t.impressions, 0)
    const totalClicks = clusterTerms.reduce((sum, t) => sum + t.clicks, 0)
    const avgScore = clusterTerms.reduce((sum, t) => sum + t.score, 0) / clusterTerms.length
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    
    clusterSimilarities.push({
      clusterId: cid,
      terms: clusterTerms,
      avgScore,
      avgCTR,
      similarity: avgSimilarity
    })
  }
  
  return clusterSimilarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxClusters)
    .map(({ similarity, ...rest }) => rest)
}

export function getRelatedTerms(
  selectedTerm: EnrichedTermData,
  allTerms: EnrichedTermData[],
  maxRelated: number = 12
): EnrichedTermData[] {
  return allTerms
    .filter((term) => term.term !== selectedTerm.term)
    .map((term) => {
      const semanticSimilarity = calculateSemanticSimilarity(selectedTerm.term, term.term)
      const scoreDiff = Math.abs(term.score - selectedTerm.score)
      // Combine semantic similarity (0-1) with score proximity (0-1)
      const similarity = semanticSimilarity * 0.8 + (1 - scoreDiff) * 0.2

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
    clusterId: selectedTerm.clusterId,
  }
}

// Get all terms in the same cluster as the selected term
export function getClusterTerms(
  selectedTerm: EnrichedTermData,
  allTerms: EnrichedTermData[]
): EnrichedTermData[] {
  if (selectedTerm.clusterId === undefined) {
    // Fall back to related terms if no clusterId
    return getRelatedTerms(selectedTerm, allTerms, 20)
  }
  
  return allTerms.filter(term => term.clusterId === selectedTerm.clusterId)
}

// Source data imported from the complete GSC export
export const RADAR_DATA: RawTermData[] = RAW_RADAR_DATA

export function getInitialRadarData(): RawTermData[] {
  return RADAR_DATA
}

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
