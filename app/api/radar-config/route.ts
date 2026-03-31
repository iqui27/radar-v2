import { NextResponse } from 'next/server'
import { sanitizeRadarConfig } from '@/lib/radar-data'
import { radarConfigSnapshotSchema } from '@/lib/radar-schemas'
import {
  readRadarGlobalConfigStateFromEdge,
  replaceRadarGlobalConfigState,
  updateRadarGlobalCurrentConfig,
} from '@/lib/radar-global-config.server'

export async function GET() {
  const payload = await readRadarGlobalConfigStateFromEdge()
  return NextResponse.json(payload)
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    if (body?.configSnapshots) {
      const nextState = await replaceRadarGlobalConfigState({
        currentConfig: sanitizeRadarConfig(body.currentConfig),
        configSnapshots: body.configSnapshots.map((snapshot: unknown) =>
          radarConfigSnapshotSchema.parse(snapshot)
        ),
      })

      return NextResponse.json({
        state: nextState,
        source: 'edge-config',
      })
    }

    const nextState = await updateRadarGlobalCurrentConfig(body.currentConfig)

    return NextResponse.json({
      state: nextState,
      source: 'edge-config',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao atualizar a configuracao global.',
      },
      { status: 500 }
    )
  }
}
