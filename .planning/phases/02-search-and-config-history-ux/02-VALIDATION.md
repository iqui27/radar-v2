---
phase: 2
slug: search-and-config-history-ux
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-31
---

# Phase 2 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler + Next build |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `pnpm exec tsc --noEmit` |
| **Full suite command** | `pnpm build` |
| **Estimated runtime** | ~20-60 seconds |

## Sampling Rate

- **After every task commit:** Run `pnpm exec tsc --noEmit`
- **After every plan wave:** Run `pnpm build`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | HIST-01 | typecheck | `pnpm exec tsc --noEmit` | ✅ | pending |
| 2-02-01 | 02 | 2 | CONF-03 | build | `pnpm build` | ✅ | pending |
| 2-03-01 | 03 | 3 | HIST-02 | build + smoke | `pnpm build` | ✅ | pending |

## Wave 0 Requirements

- [x] Existing infrastructure covers all phase requirements.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Restore de snapshot reflete imediatamente no preview e no score | CONF-03 | depende de leitura visual do painel e preview | alterar config, salvar, restaurar snapshot anterior e confirmar retorno visual |
| Delta historico faz sentido para o termo selecionado | HIST-02 / HIST-03 | exige julgamento humano da narrativa do delta | selecionar termos, comparar com baseline mostrado e verificar coerencia |

## Validation Sign-Off

- [x] All tasks have automated verify or existing infra
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
