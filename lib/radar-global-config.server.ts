import 'server-only'

import { get } from '@vercel/edge-config'
import {
  type RadarConfigSnapshot,
  type RadarGlobalConfigState,
} from './radar-schemas'
import {
  createEmptyRadarGlobalConfigState,
  normalizeRadarGlobalConfigState,
} from './radar-persistence'
import { sanitizeRadarConfig, type RadarConfig } from './radar-data'

const RADAR_GLOBAL_CONFIG_KEY = 'radar_global_config'

function resolveEdgeConfigId(): string | null {
  const explicitId = process.env.EDGE_CONFIG_ID ?? process.env.VERCEL_EDGE_CONFIG_ID ?? null

  if (explicitId) {
    return explicitId
  }

  const connectionString = process.env.EDGE_CONFIG

  if (!connectionString) {
    return null
  }

  const match = connectionString.match(/edge-config\.vercel\.com\/([^/?]+)/)
  return match?.[1] ?? null
}

function getWriteCredentials() {
  const edgeConfigId = resolveEdgeConfigId()
  const accessToken = process.env.VERCEL_ACCESS_TOKEN ?? null
  const teamId = process.env.VERCEL_TEAM_ID ?? null

  return {
    edgeConfigId,
    accessToken,
    teamId,
  }
}

function canReadEdgeConfig(): boolean {
  return Boolean(process.env.EDGE_CONFIG)
}

function canWriteEdgeConfig(): boolean {
  const { edgeConfigId, accessToken } = getWriteCredentials()
  return Boolean(edgeConfigId && accessToken)
}

export async function readRadarGlobalConfigStateFromEdge(): Promise<{
  state: RadarGlobalConfigState
  source: 'edge-config' | 'default'
}> {
  if (!canReadEdgeConfig()) {
    return {
      state: createEmptyRadarGlobalConfigState(),
      source: 'default',
    }
  }

  const stored = await get<RadarGlobalConfigState | null>(RADAR_GLOBAL_CONFIG_KEY)

  if (!stored) {
    return {
      state: createEmptyRadarGlobalConfigState(),
      source: 'default',
    }
  }

  return {
    state: normalizeRadarGlobalConfigState(stored),
    source: 'edge-config',
  }
}

async function writeRawRadarGlobalConfigState(state: RadarGlobalConfigState) {
  const { edgeConfigId, accessToken, teamId } = getWriteCredentials()

  if (!edgeConfigId || !accessToken) {
    throw new Error(
      'Configuracao global indisponivel. Defina EDGE_CONFIG, EDGE_CONFIG_ID/VERCEL_EDGE_CONFIG_ID e VERCEL_ACCESS_TOKEN.'
    )
  }

  const search = new URLSearchParams()

  if (teamId) {
    search.set('teamId', teamId)
  }

  const response = await fetch(
    `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items?${search.toString()}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: RADAR_GLOBAL_CONFIG_KEY,
            value: state,
          },
        ],
      }),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(payload || 'Falha ao escrever configuracao global no Edge Config.')
  }
}

export async function replaceRadarGlobalConfigState(
  state: Partial<RadarGlobalConfigState>
): Promise<RadarGlobalConfigState> {
  if (!canWriteEdgeConfig()) {
    throw new Error(
      'Escrita global indisponivel. Configure EDGE_CONFIG, EDGE_CONFIG_ID/VERCEL_EDGE_CONFIG_ID e VERCEL_ACCESS_TOKEN na Vercel.'
    )
  }

  const nextState = normalizeRadarGlobalConfigState({
    ...state,
    updatedAt: new Date().toISOString(),
  })

  await writeRawRadarGlobalConfigState(nextState)

  return nextState
}

export async function updateRadarGlobalCurrentConfig(
  currentConfig: RadarConfig
): Promise<RadarGlobalConfigState> {
  const { state } = await readRadarGlobalConfigStateFromEdge()

  return replaceRadarGlobalConfigState({
    ...state,
    currentConfig: sanitizeRadarConfig(currentConfig),
  })
}

export async function appendRadarGlobalSnapshotServer(
  snapshot: RadarConfigSnapshot
): Promise<RadarGlobalConfigState> {
  const { state } = await readRadarGlobalConfigStateFromEdge()

  return replaceRadarGlobalConfigState({
    ...state,
    currentConfig: sanitizeRadarConfig(snapshot.config),
    configSnapshots: [snapshot, ...state.configSnapshots].slice(0, 50),
  })
}

export async function deleteRadarGlobalSnapshotServer(
  snapshotId: string
): Promise<RadarGlobalConfigState> {
  const { state } = await readRadarGlobalConfigStateFromEdge()

  return replaceRadarGlobalConfigState({
    ...state,
    configSnapshots: state.configSnapshots.filter((snapshot) => snapshot.id !== snapshotId),
  })
}
