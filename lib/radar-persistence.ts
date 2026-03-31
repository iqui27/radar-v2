import {
  RADAR_STORAGE_VERSION,
  radarConfigSnapshotSchema,
  radarPersistenceStateSchema,
  radarSearchHistoryEntrySchema,
  type RadarConfigInput,
  type RadarConfigSnapshot,
  type RadarPersistenceState,
  type RadarSearchHistoryEntry,
  type RadarTermMetricSnapshot,
} from './radar-schemas'

const RADAR_STORAGE_KEY = 'radar:v2:state'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function createId(prefix: string): string {
  const seed =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  return `${prefix}-${seed}`
}

export function createEmptyRadarPersistenceState(): RadarPersistenceState {
  return {
    version: RADAR_STORAGE_VERSION,
    currentConfig: null,
    configSnapshots: [],
    searchHistory: [],
    dataSources: [],
    activeDataSourceId: null,
  }
}

export function readRadarPersistenceState(): RadarPersistenceState {
  if (!isBrowser()) {
    return createEmptyRadarPersistenceState()
  }

  const raw = window.localStorage.getItem(RADAR_STORAGE_KEY)

  if (!raw) {
    return createEmptyRadarPersistenceState()
  }

  try {
    const parsed = JSON.parse(raw)
    const result = radarPersistenceStateSchema.safeParse(parsed)
    return result.success ? result.data : createEmptyRadarPersistenceState()
  } catch {
    return createEmptyRadarPersistenceState()
  }
}

export function writeRadarPersistenceState(state: RadarPersistenceState): RadarPersistenceState {
  const normalized = radarPersistenceStateSchema.parse(state)

  if (isBrowser()) {
    window.localStorage.setItem(RADAR_STORAGE_KEY, JSON.stringify(normalized))
  }

  return normalized
}

export function createRadarConfigSnapshot(input: {
  label?: string
  config: RadarConfigInput
  selectedTerm?: string | null
  dataSourceId?: string | null
  termSnapshot?: RadarTermMetricSnapshot | null
  createdAt?: string
}): RadarConfigSnapshot {
  return radarConfigSnapshotSchema.parse({
    id: createId('cfg'),
    version: RADAR_STORAGE_VERSION,
    label: input.label ?? 'Configuracao salva',
    createdAt: input.createdAt ?? new Date().toISOString(),
    selectedTerm: input.selectedTerm ?? null,
    dataSourceId: input.dataSourceId ?? null,
    config: input.config,
    termSnapshot: input.termSnapshot ?? null,
  })
}

export function appendRadarConfigSnapshot(
  state: RadarPersistenceState,
  snapshot: RadarConfigSnapshot,
  limit: number = 50
): RadarPersistenceState {
  return {
    ...state,
    configSnapshots: [snapshot, ...state.configSnapshots].slice(0, limit),
  }
}

export function removeRadarConfigSnapshot(
  state: RadarPersistenceState,
  snapshotId: string
): RadarPersistenceState {
  return {
    ...state,
    configSnapshots: state.configSnapshots.filter((snapshot) => snapshot.id !== snapshotId),
  }
}

export function createRadarSearchHistoryEntry(input: {
  query: string
  selectedTerm?: string | null
  dataSourceId: string
  interaction?: 'query' | 'selection'
  termSnapshot?: RadarTermMetricSnapshot | null
  createdAt?: string
}): RadarSearchHistoryEntry {
  return radarSearchHistoryEntrySchema.parse({
    id: createId('search'),
    query: input.query,
    selectedTerm: input.selectedTerm ?? null,
    dataSourceId: input.dataSourceId,
    interaction: input.interaction ?? 'selection',
    createdAt: input.createdAt ?? new Date().toISOString(),
    termSnapshot: input.termSnapshot ?? null,
  })
}

export function appendRadarSearchHistoryEntry(
  state: RadarPersistenceState,
  entry: RadarSearchHistoryEntry,
  limit: number = 100
): RadarPersistenceState {
  return {
    ...state,
    searchHistory: [entry, ...state.searchHistory].slice(0, limit),
  }
}

export function clearRadarPersistenceState(): void {
  if (isBrowser()) {
    window.localStorage.removeItem(RADAR_STORAGE_KEY)
  }
}
