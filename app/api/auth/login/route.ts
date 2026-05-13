import { NextResponse } from 'next/server'
import { createAuthToken, getAuthCookieOptions, getConfiguredPassword, RADAR_AUTH_COOKIE } from '@/lib/radar-auth'

export async function POST(request: Request) {
  const configuredPassword = getConfiguredPassword()

  if (!configuredPassword) {
    return NextResponse.json(
      { error: 'Login indisponivel. Configure RADAR_AUTH_PASSWORD na Vercel.' },
      { status: 503 },
    )
  }

  const body = await request.json().catch(() => null)
  const password = typeof body?.password === 'string' ? body.password : ''

  if (password !== configuredPassword) {
    return NextResponse.json({ error: 'Senha invalida.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(RADAR_AUTH_COOKIE, await createAuthToken(), getAuthCookieOptions())

  return response
}
