---
phase: 1
slug: persistence-and-data-registry
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-31
---

# Phase 1 - Validation Strategy

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
| 1-01-01 | 01 | 1 | CONF-01 | typecheck | `pnpm exec tsc --noEmit` | ✅ | pending |
| 1-02-01 | 02 | 2 | DATA-02 | build | `pnpm build` | ✅ | pending |
| 1-03-01 | 03 | 3 | CONF-02 | build + smoke | `pnpm build` | ✅ | pending |

## Wave 0 Requirements

- [x] Existing infrastructure covers all phase requirements.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Configuracao salva e reaparece apos reload | CONF-02 | persistence browser depende de interacao real | abrir dashboard, alterar config, salvar, recarregar e verificar hydration |
| Origem de dados inicial permanece consistente apos bootstrap | DATA-02 | requer leitura visual combinada de KPI e consulta | abrir dashboard, confirmar KPIs e consulta com mesma origem ativa |

## Validation Sign-Off

- [x] All tasks have automated verify or existing infra
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
