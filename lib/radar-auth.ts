export const RADAR_AUTH_COOKIE = 'radar_auth'

const SESSION_TTL_SECONDS = 60 * 60 * 12
const textEncoder = new TextEncoder()

type AuthPayload = {
  exp: number
  iat: number
}

function getAuthSecret() {
  return process.env.RADAR_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'radar-local-dev-secret'
}

export function getConfiguredPassword() {
  if (process.env.RADAR_AUTH_PASSWORD) {
    return process.env.RADAR_AUTH_PASSWORD
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'radar'
  }

  return null
}

function base64UrlEncode(input: string | ArrayBuffer) {
  const bytes =
    typeof input === 'string'
      ? textEncoder.encode(input)
      : new Uint8Array(input)

  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function base64UrlDecode(input: string) {
  const padded = input.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(getAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value))
  return base64UrlEncode(signature)
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false

  let diff = 0
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return diff === 0
}

export async function createAuthToken() {
  const now = Math.floor(Date.now() / 1000)
  const payload: AuthPayload = {
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = await sign(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export async function verifyAuthToken(token: string | undefined | null) {
  if (!token) return false

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return false

  const expectedSignature = await sign(encodedPayload)
  if (!safeEqual(signature, expectedSignature)) return false

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthPayload
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}
