import type {
  RadarConfigSnapshot,
  RadarSearchHistoryEntry,
  RadarTermMetricSnapshot,
} from './radar-schemas'
import type { RadarConfig, EnrichedTermData } from './radar-data'

export interface SearchHistoryListItem {
  id: string
  query: string
  selectedTerm: string | null
  dataSourceId: string
  createdAt: string
  interaction: 'query' | 'selection'
  termSnapshot: RadarTermMetricSnapshot | null
  summaryLabel: string
  relativeLabel: string
}

export interface ConfigSnapshotListItem {
  id: string
  label: string
  createdAt: string
  selectedTerm: string | null
  dataSourceId: string | null
  termSnapshot: RadarTermMetricSnapshot | null
  isCurrent: boolean
  relativeLabel: string
}

export interface MetricDeltaValue {
  current: number
  baseline: number
  change: number
  percentChange: number | null
  direction: 'up' | 'down' | 'flat'
}

export interface TermMetricDeltaSet {
  score: MetricDeltaValue
  position: MetricDeltaValue
  ctr: MetricDeltaValue
  clicks: MetricDeltaValue
  impressions: MetricDeltaValue
}

export interface TermMetricBaseline {
  source: 'search-history' | 'config-snapshot'
  sourceLabel: string
  baseline: RadarTermMetricSnapshot
  comparisonLabel: string
  deltas: TermMetricDeltaSet
}

function toDateValue(value: string): number {
  return new Date(value).getTime()
}

function formatRelativeTimestamp(value: string): string {
  const now = Date.now()
  const diffMs = Math.max(0, now - toDateValue(value))
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes < 1) return 'agora'
  if (diffMinutes < 60) return `${diffMinutes} min atras`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h atras`

  const diffDays = Math.round(diffHours / 24)
  if (diffDays <= 7) return `${diffDays}d atras`

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function sameConfig(a: RadarConfig, b: RadarConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function sameSnapshot(
  a: RadarTermMetricSnapshot | null | undefined,
  b: RadarTermMetricSnapshot | null | undefined
): boolean {
  if (!a || !b) return false

  return (
    a.term === b.term &&
    a.score === b.score &&
    a.position === b.position &&
    a.ctr === b.ctr &&
    a.clicks === b.clicks &&
    a.impressions === b.impressions &&
    a.expCTR === b.expCTR
  )
}

function createMetricDelta(current: number, baseline: number, invertDirection = false): MetricDeltaValue {
  const change = current - baseline
  const percentChange = baseline === 0 ? null : (change / baseline) * 100

  let direction: MetricDeltaValue['direction'] = 'flat'
  if (change > 0.0001) direction = 'up'
  if (change < -0.0001) direction = 'down'

  if (invertDirection) {
    direction = direction === 'up' ? 'down' : direction === 'down' ? 'up' : 'flat'
  }

  return {
    current,
    baseline,
    change,
    percentChange,
    direction,
  }
}

export function createTermMetricSnapshot(term: EnrichedTermData): RadarTermMetricSnapshot {
  return {
    term: term.term,
    score: term.score,
    position: term.position,
    ctr: term.ctr,
    clicks: term.clicks,
    impressions: term.impressions,
    expCTR: term.expCTR,
    actionLabel: term.action.label,
  }
}

export function getRecentSearchHistory(
  entries: RadarSearchHistoryEntry[],
  limit: number = 6
): SearchHistoryListItem[] {
  const seen = new Set<string>()

  return [...entries]
    .sort((a, b) => toDateValue(b.createdAt) - toDateValue(a.createdAt))
    .filter((entry) => {
      const key = `${entry.dataSourceId}:${entry.selectedTerm ?? entry.query}:${entry.interaction}`
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
    .slice(0, limit)
    .map((entry) => ({
      ...entry,
      summaryLabel:
        entry.selectedTerm && entry.query !== entry.selectedTerm
          ? `${entry.query} -> ${entry.selectedTerm}`
          : entry.selectedTerm ?? entry.query,
      relativeLabel: formatRelativeTimestamp(entry.createdAt),
    }))
}

export function getConfigSnapshotHistory(
  snapshots: RadarConfigSnapshot[],
  currentConfig: RadarConfig,
  limit: number = 6
): ConfigSnapshotListItem[] {
  const ordered = [...snapshots].sort((a, b) => toDateValue(b.createdAt) - toDateValue(a.createdAt))
  let currentMarked = false

  return ordered.slice(0, limit).map((snapshot) => {
    const matchesCurrent = !currentMarked && sameConfig(snapshot.config as RadarConfig, currentConfig)

    if (matchesCurrent) {
      currentMarked = true
    }

    return {
      id: snapshot.id,
      label: snapshot.label,
      createdAt: snapshot.createdAt,
      selectedTerm: snapshot.selectedTerm,
      dataSourceId: snapshot.dataSourceId,
      termSnapshot: snapshot.termSnapshot,
      isCurrent: matchesCurrent,
      relativeLabel: formatRelativeTimestamp(snapshot.createdAt),
    }
  })
}

export function resolveTermMetricBaseline(input: {
  term: EnrichedTermData
  searchHistory: RadarSearchHistoryEntry[]
  configSnapshots: RadarConfigSnapshot[]
  currentConfig: RadarConfig
  dataSourceId: string
  currentHistoryEntryId?: string | null
}): TermMetricBaseline | null {
  const currentSnapshot = createTermMetricSnapshot(input.term)

  const priorSelection = [...input.searchHistory]
    .sort((a, b) => toDateValue(b.createdAt) - toDateValue(a.createdAt))
    .find((entry) => {
      if (!entry.termSnapshot || !entry.selectedTerm) return false
      if (entry.selectedTerm !== input.term.term || entry.dataSourceId !== input.dataSourceId) return false
      if (input.currentHistoryEntryId && entry.id === input.currentHistoryEntryId) return false
      return !sameSnapshot(entry.termSnapshot, currentSnapshot)
    })

  if (priorSelection?.termSnapshot) {
    return {
      source: 'search-history',
      sourceLabel: 'Comparado com a selecao anterior do mesmo termo',
      baseline: priorSelection.termSnapshot,
      comparisonLabel: formatRelativeTimestamp(priorSelection.createdAt),
      deltas: {
        score: createMetricDelta(currentSnapshot.score, priorSelection.termSnapshot.score),
        position: createMetricDelta(currentSnapshot.position, priorSelection.termSnapshot.position, true),
        ctr: createMetricDelta(currentSnapshot.ctr, priorSelection.termSnapshot.ctr),
        clicks: createMetricDelta(currentSnapshot.clicks, priorSelection.termSnapshot.clicks),
        impressions: createMetricDelta(currentSnapshot.impressions, priorSelection.termSnapshot.impressions),
      },
    }
  }

  const orderedSnapshots = [...input.configSnapshots].sort(
    (a, b) => toDateValue(b.createdAt) - toDateValue(a.createdAt)
  )
  const matchingCurrentSnapshotIndex = orderedSnapshots.findIndex((snapshot) =>
    sameConfig(snapshot.config as RadarConfig, input.currentConfig)
  )

  const configBaseline = orderedSnapshots.find((snapshot, index) => {
    if (!snapshot.termSnapshot || snapshot.selectedTerm !== input.term.term) return false
    if (snapshot.dataSourceId && snapshot.dataSourceId !== input.dataSourceId) return false
    if (matchingCurrentSnapshotIndex !== -1 && index <= matchingCurrentSnapshotIndex) return false
    return !sameSnapshot(snapshot.termSnapshot, currentSnapshot)
  })

  if (!configBaseline?.termSnapshot) {
    return null
  }

  return {
    source: 'config-snapshot',
    sourceLabel: 'Comparado com o ultimo snapshot de configuracao do termo',
    baseline: configBaseline.termSnapshot,
    comparisonLabel: formatRelativeTimestamp(configBaseline.createdAt),
    deltas: {
      score: createMetricDelta(currentSnapshot.score, configBaseline.termSnapshot.score),
      position: createMetricDelta(currentSnapshot.position, configBaseline.termSnapshot.position, true),
      ctr: createMetricDelta(currentSnapshot.ctr, configBaseline.termSnapshot.ctr),
      clicks: createMetricDelta(currentSnapshot.clicks, configBaseline.termSnapshot.clicks),
      impressions: createMetricDelta(currentSnapshot.impressions, configBaseline.termSnapshot.impressions),
    },
  }
}
