import { RAW_RADAR_DATA } from './radar-data-source'
import {
  type RadarDataSourceRecord,
  type RadarPersistenceState,
  type RawTermDataInput,
  radarDataSourceRecordSchema,
} from './radar-schemas'
import { readRadarPersistenceState, writeRadarPersistenceState } from './radar-persistence'

const EMBEDDED_SOURCE_ID = 'embedded-radar-90d-v1'

function createSourceId(prefix: string): string {
  const seed =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  return `${prefix}-${seed}`
}

export function createEmbeddedRadarDataSource(
  data: RawTermDataInput[] = RAW_RADAR_DATA
): RadarDataSourceRecord {
  return radarDataSourceRecordSchema.parse({
    id: EMBEDDED_SOURCE_ID,
    version: 1,
    label: 'Base embarcada 90 dias',
    kind: 'embedded',
    createdAt: new Date('2026-03-31T00:00:00.000Z').toISOString(),
    recordCount: data.length,
    isActive: true,
    data,
    meta: {
      notes: 'Dataset local bootstrap do RADAR v2',
    },
  })
}

export function bootstrapRadarPersistenceState(
  state: RadarPersistenceState,
  fallbackData: RawTermDataInput[] = RAW_RADAR_DATA
): RadarPersistenceState {
  if (state.dataSources.length > 0) {
    return ensureSingleActiveRadarDataSource(state)
  }

  return {
    ...state,
    dataSources: [createEmbeddedRadarDataSource(fallbackData)],
    activeDataSourceId: EMBEDDED_SOURCE_ID,
  }
}

export function ensureSingleActiveRadarDataSource(
  state: RadarPersistenceState
): RadarPersistenceState {
  if (state.dataSources.length === 0) {
    return bootstrapRadarPersistenceState(state)
  }

  const activeId =
    state.activeDataSourceId ??
    state.dataSources.find((source) => source.isActive)?.id ??
    state.dataSources[0]?.id ??
    null

  return {
    ...state,
    activeDataSourceId: activeId,
    dataSources: state.dataSources.map((source) => ({
      ...source,
      isActive: source.id === activeId,
    })),
  }
}

export function getRadarPersistenceWithSources(): RadarPersistenceState {
  const state = readRadarPersistenceState()
  const bootstrapped = bootstrapRadarPersistenceState(state)

  if (
    state.dataSources.length !== bootstrapped.dataSources.length ||
    state.activeDataSourceId !== bootstrapped.activeDataSourceId
  ) {
    writeRadarPersistenceState(bootstrapped)
  }

  return bootstrapped
}

export function getActiveRadarDataSource(
  state: RadarPersistenceState
): RadarDataSourceRecord {
  const normalized = ensureSingleActiveRadarDataSource(state)

  return (
    normalized.dataSources.find((source) => source.id === normalized.activeDataSourceId) ??
    normalized.dataSources[0] ??
    createEmbeddedRadarDataSource()
  )
}

export function getActiveRadarData(
  state: RadarPersistenceState
): RawTermDataInput[] {
  return getActiveRadarDataSource(state).data
}

export function setActiveRadarDataSource(
  state: RadarPersistenceState,
  sourceId: string
): RadarPersistenceState {
  const hasSource = state.dataSources.some((source) => source.id === sourceId)

  if (!hasSource) {
    return ensureSingleActiveRadarDataSource(state)
  }

  return {
    ...state,
    activeDataSourceId: sourceId,
    dataSources: state.dataSources.map((source) => ({
      ...source,
      isActive: source.id === sourceId,
    })),
  }
}

export function registerImportedRadarDataSource(
  state: RadarPersistenceState,
  input: {
    label: string
    data: RawTermDataInput[]
    filename?: string
    notes?: string
    activate?: boolean
  }
): RadarPersistenceState {
  const nextSource = radarDataSourceRecordSchema.parse({
    id: createSourceId('import'),
    version: 1,
    label: input.label,
    kind: 'imported',
    createdAt: new Date().toISOString(),
    recordCount: input.data.length,
    isActive: input.activate ?? true,
    data: input.data,
    meta: {
      filename: input.filename,
      notes: input.notes,
    },
  })

  const appendedState = {
    ...state,
    dataSources: [...state.dataSources, nextSource],
    activeDataSourceId: nextSource.isActive ? nextSource.id : state.activeDataSourceId,
  }

  return ensureSingleActiveRadarDataSource(appendedState)
}
