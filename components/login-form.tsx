'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LockKeyhole, Radar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.error ?? 'Nao foi possivel entrar.')
      return
    }

    const nextPath = searchParams.get('next')
    startTransition(() => {
      router.replace(nextPath?.startsWith('/') ? nextPath : '/')
      router.refresh()
    })
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(99,102,241,0.18),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(16,185,129,0.12),transparent_28%)]" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="hidden lg:block">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Radar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                  Search Intelligence
                </p>
                <h1 className="mt-2 text-5xl font-semibold tracking-[-0.06em]">RADAR</h1>
              </div>
            </div>
            <p className="max-w-xl text-2xl font-medium leading-tight tracking-[-0.04em] text-muted-foreground">
              Acesso restrito ao painel de análise e configuração do indicador.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="radar-shell-surface mx-auto w-full max-w-[420px] rounded-[30px] border border-border/60 p-6 shadow-2xl shadow-black/20"
          >
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Radar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                  Search Intelligence
                </p>
                <h1 className="text-3xl font-semibold tracking-[-0.05em]">RADAR</h1>
              </div>
            </div>

            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">Entrar no dashboard</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Informe a senha do prototipo para visualizar os dados do RADAR.
            </p>

            <label className="mt-8 block text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Senha
            </label>
            <Input
              autoFocus
              className="mt-3 h-12 rounded-2xl border-border/70 bg-background/70 px-4"
              value={password}
              type="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite a senha"
            />

            {error ? (
              <p className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button className="mt-6 h-12 w-full rounded-2xl" type="submit" disabled={isPending || !password}>
              {isPending ? 'Entrando...' : 'Acessar'}
            </Button>

            <p className="mt-5 text-center text-[11px] text-muted-foreground">
              Sessao protegida por cookie seguro HTTP-only.
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
