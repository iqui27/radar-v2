import {
  RADAR_STORAGE_VERSION,
  legacyRadarPersistenceStateSchema,
  radarConfigSnapshotSchema,
  radarGlobalConfigStateSchema,
  radarLocalPersistenceStateSchema,
  radarSearchHistoryEntrySchema,
  type RadarConfigInput,
  type RadarConfigSnapshot,
  type RadarGlobalConfigState,
  type RadarLegacyPersistenceState,
  type RadarPersistenceState,
  type RadarSearchHistoryEntry,
  type RadarTermMetricSnapshot,
} from './radar-schemas'
import { DEFAULT_CONFIG, sanitizeRadarConfig } from './radar-data'

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
    const localResult = radarLocalPersistenceStateSchema.safeParse(parsed)

    if (localResult.success) {
      return localResult.data
    }

    const legacyResult = legacyRadarPersistenceStateSchema.safeParse(parsed)

    if (legacyResult.success) {
      return extractLocalPersistenceState(legacyResult.data)
    }

    return createEmptyRadarPersistenceState()
  } catch {
    return createEmptyRadarPersistenceState()
  }
}

export function writeRadarPersistenceState(state: RadarPersistenceState): RadarPersistenceState {
  const normalized = radarLocalPersistenceStateSchema.parse(state)

  if (isBrowser()) {
    window.localStorage.setItem(RADAR_STORAGE_KEY, JSON.stringify(normalized))
  }

  return normalized
}

export function readLegacyRadarPersistenceState(): RadarLegacyPersistenceState | null {
  if (!isBrowser()) {
    return null
  }

  const raw = window.localStorage.getItem(RADAR_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    const result = legacyRadarPersistenceStateSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

function extractLocalPersistenceState(state: RadarLegacyPersistenceState): RadarPersistenceState {
  return {
    version: RADAR_STORAGE_VERSION,
    searchHistory: state.searchHistory,
    dataSources: state.dataSources,
    activeDataSourceId: state.activeDataSourceId,
  }
}

export function createEmptyRadarGlobalConfigState(): RadarGlobalConfigState {
  return {
    version: RADAR_STORAGE_VERSION,
    currentConfig: sanitizeRadarConfig(DEFAULT_CONFIG),
    configSnapshots: [],
    updatedAt: new Date(0).toISOString(),
  }
}

export function normalizeRadarGlobalConfigState(
  input: Partial<RadarGlobalConfigState> | null | undefined
): RadarGlobalConfigState {
  const base = createEmptyRadarGlobalConfigState()

  return radarGlobalConfigStateSchema.parse({
    version: RADAR_STORAGE_VERSION,
    currentConfig: sanitizeRadarConfig(input?.currentConfig ?? base.currentConfig),
    configSnapshots: (input?.configSnapshots ?? base.configSnapshots).map((snapshot) =>
      radarConfigSnapshotSchema.parse(snapshot)
    ),
    updatedAt: input?.updatedAt ?? new Date().toISOString(),
  })
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
  state: RadarGlobalConfigState,
  snapshot: RadarConfigSnapshot,
  limit: number = 50
): RadarGlobalConfigState {
  return {
    ...state,
    configSnapshots: [snapshot, ...state.configSnapshots].slice(0, limit),
  }
}

export function removeRadarConfigSnapshot(
  state: RadarGlobalConfigState,
  snapshotId: string
): RadarGlobalConfigState {
  return {
    ...state,
    configSnapshots: state.configSnapshots.filter((snapshot: RadarConfigSnapshot) => snapshot.id !== snapshotId),
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

export interface RadarGlobalConfigResponse {
  state: RadarGlobalConfigState
  source: 'edge-config' | 'default'
}

async function parseGlobalConfigResponse(response: Response): Promise<RadarGlobalConfigResponse> {
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload) {
    const errorMessage =
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : 'Falha ao sincronizar a configuracao global.'

    throw new Error(errorMessage)
  }

  return {
    state: normalizeRadarGlobalConfigState(payload.state),
    source: payload.source === 'edge-config' ? 'edge-config' : 'default',
  }
}

export async function fetchRadarGlobalConfigState(): Promise<RadarGlobalConfigResponse> {
  const response = await fetch('/api/radar-config', {
    method: 'GET',
    cache: 'no-store',
  })

  return parseGlobalConfigResponse(response)
}

export async function updateRadarGlobalConfig(
  currentConfig: RadarConfigInput
): Promise<RadarGlobalConfigState> {
  const response = await fetch('/api/radar-config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentConfig }),
  })

  const payload = await parseGlobalConfigResponse(response)
  return payload.state
}

export async function appendRadarGlobalConfigSnapshot(
  snapshot: RadarConfigSnapshot
): Promise<RadarGlobalConfigState> {
  const response = await fetch('/api/radar-config/snapshots', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ snapshot }),
  })

  const payload = await parseGlobalConfigResponse(response)
  return payload.state
}

export async function deleteRadarGlobalConfigSnapshot(
  snapshotId: string
): Promise<RadarGlobalConfigState> {
  const response = await fetch(`/api/radar-config/snapshots/${snapshotId}`, {
    method: 'DELETE',
  })

  const payload = await parseGlobalConfigResponse(response)
  return payload.state
}
