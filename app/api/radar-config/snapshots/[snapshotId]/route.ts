import { NextResponse } from 'next/server'
import { deleteRadarGlobalSnapshotServer } from '@/lib/radar-global-config.server'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ snapshotId: string }> }
) {
  try {
    const { snapshotId } = await context.params
    const nextState = await deleteRadarGlobalSnapshotServer(snapshotId)

    return NextResponse.json({
      state: nextState,
      source: 'edge-config',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao apagar o snapshot global.',
      },
      { status: 500 }
    )
  }
}
