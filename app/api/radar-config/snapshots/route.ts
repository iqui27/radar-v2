import { NextResponse } from 'next/server'
import { radarConfigSnapshotSchema } from '@/lib/radar-schemas'
import { appendRadarGlobalSnapshotServer } from '@/lib/radar-global-config.server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const snapshot = radarConfigSnapshotSchema.parse(body?.snapshot)
    const nextState = await appendRadarGlobalSnapshotServer(snapshot)

    return NextResponse.json({
      state: nextState,
      source: 'edge-config',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao salvar o snapshot global.',
      },
      { status: 500 }
    )
  }
}
