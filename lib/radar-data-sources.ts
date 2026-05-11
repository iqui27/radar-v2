import { RAW_RADAR_DATA } from './radar-data-source'
import { DEFAULT_PRODUCT_SOURCE_ID, PRODUCT_RADAR_DATA } from './radar-product-data'
import {
  type RadarDataSourceRecord,
  type RadarPersistenceState,
  type RawTermDataInput,
  radarDataSourceRecordSchema,
} from './radar-schemas'
import { readRadarPersistenceState, writeRadarPersistenceState } from './radar-persistence'

const LEGACY_EMBEDDED_SOURCE_ID = 'embedded-radar-90d-v1'

function createSourceId(prefix: string): string {
  const seed =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  return `${prefix}-${seed}`
}

function slugifySourceKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getNextSourceVersion(state: RadarPersistenceState, sourceKey: string): number {
  return (
    state.dataSources
      .filter((source) => source.meta.sourceKey === sourceKey)
      .reduce((max, source) => Math.max(max, source.meta.sourceVersion ?? 1), 0) + 1
  )
}

export function createProductRadarDataSources(): RadarDataSourceRecord[] {
  return PRODUCT_RADAR_DATA.map((product) =>
    radarDataSourceRecordSchema.parse({
      id: product.id,
      version: 1,
      label: product.label,
      kind: 'embedded',
      createdAt: product.createdAt,
      recordCount: product.data.length,
      isActive: product.id === DEFAULT_PRODUCT_SOURCE_ID,
      data: product.data,
      meta: {
        sourceKey: product.sourceKey,
        sourceVersion: 1,
        notes: 'Dataset embarcado por produto para preview RADAR.',
      },
    })
  )
}

export function createEmbeddedRadarDataSource(
  data: RawTermDataInput[] = RAW_RADAR_DATA
): RadarDataSourceRecord {
  return radarDataSourceRecordSchema.parse({
    id: LEGACY_EMBEDDED_SOURCE_ID,
    version: 1,
    label: 'Base embarcada 90 dias',
    kind: 'embedded',
    createdAt: new Date('2026-03-31T00:00:00.000Z').toISOString(),
    recordCount: data.length,
    isActive: true,
    data,
    meta: {
      sourceKey: 'embedded-radar',
      sourceVersion: 1,
      notes: 'Dataset local bootstrap do RADAR v2',
    },
  })
}

export function bootstrapRadarPersistenceState(
  state: RadarPersistenceState,
  fallbackData: RawTermDataInput[] = RAW_RADAR_DATA
): RadarPersistenceState {
  const productSources = createProductRadarDataSources()
  const productIds = new Set(productSources.map((source) => source.id))
  const importedSources = state.dataSources.filter((source) => source.kind === 'imported')
  const currentActiveId =
    state.activeDataSourceId && state.activeDataSourceId !== LEGACY_EMBEDDED_SOURCE_ID
      ? state.activeDataSourceId
      : null
  const activeDataSourceId =
    currentActiveId && (productIds.has(currentActiveId) || importedSources.some((source) => source.id === currentActiveId))
      ? currentActiveId
      : DEFAULT_PRODUCT_SOURCE_ID

  const nextState = {
    ...state,
    dataSources: [
      ...productSources.map((source) => ({
        ...source,
        isActive: source.id === activeDataSourceId,
      })),
      ...importedSources.map((source) => ({
        ...source,
        isActive: source.id === activeDataSourceId,
      })),
    ],
    activeDataSourceId,
  }

  if (nextState.dataSources.length === 0) {
    return {
      ...state,
      dataSources: [createEmbeddedRadarDataSource(fallbackData)],
      activeDataSourceId: LEGACY_EMBEDDED_SOURCE_ID,
    }
  }

  return ensureSingleActiveRadarDataSource(nextState)
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
  const sourceKey = slugifySourceKey(input.filename ?? input.label)
  const sourceVersion = getNextSourceVersion(state, sourceKey)
  const importedAt = new Date().toISOString()
  const nextSource = radarDataSourceRecordSchema.parse({
    id: createSourceId('import'),
    version: 1,
    label: `${input.label} v${sourceVersion}`,
    kind: 'imported',
    createdAt: importedAt,
    recordCount: input.data.length,
    isActive: input.activate ?? true,
    data: input.data,
    meta: {
      sourceKey,
      sourceVersion,
      importedAt,
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
