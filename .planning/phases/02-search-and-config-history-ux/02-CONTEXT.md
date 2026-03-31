# Phase 2: Search and Config History UX - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Source:** PRD Express Path (.planning/phase-02-prd.md)

<domain>
## Phase Boundary

Esta fase entrega a camada visivel de historico em cima da fundacao persistida da Fase 1. O foco e tornar buscas, snapshots e comparacoes historicas legiveis no dashboard, principalmente na aba Consulta e no painel de Configuracao.
</domain>

<decisions>
## Implementation Decisions

### Locked Decisions
- A experiencia deve continuar minimalista e nao poluir o card principal.
- O historico de configuracao precisa mostrar snapshots salvos com botao de restaurar.
- O historico de busca precisa recuperar contexto util para a tomada de decisao.
- O usuario deve ver deltas de metricas ao selecionar um termo.

### the agent's Discretion
- Posicionamento exato dos componentes de historico.
- Estrategia para derivar/computar deltas historicos.
- Necessidade de helpers novos de comparacao de metricas.
- Forma de distinguir selecao anterior, snapshot anterior e contexto comparado.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing persistence foundation
- `hooks/use-radar-dashboard.ts` - fonte de config atual, snapshots, search history e origem ativa
- `lib/radar-persistence.ts` - factories e appenders de snapshots/historicos
- `lib/radar-schemas.ts` - contratos persistidos atuais
- `lib/radar-data-sources.ts` - origem ativa do dashboard

### Existing UI surfaces
- `components/dashboard/search-panel.tsx` - principal lugar da experiencia de consulta
- `components/dashboard/config-panel.tsx` - principal lugar da experiencia de snapshots e restore
- `components/dashboard/index.tsx` - shell do dashboard e wiring entre tabs

### Planning context
- `.planning/PROJECT.md` - valor central e escopo ativo
- `.planning/REQUIREMENTS.md` - requisitos da fase
- `.planning/ROADMAP.md` - goal e criteria da Fase 2
- `.planning/phases/01-persistence-and-data-registry/01-VERIFICATION.md` - o que ja foi entregue pela fundacao
</canonical_refs>

<specifics>
## Specific Ideas

- O historico de busca pode existir como uma rail/lista compacta na Consulta.
- O historico de configuracao pode existir como cards/snapshots restauraveis no painel lateral da Configuracao.
- Deltas de metricas devem se apoiar em metadata historica real, nao apenas no estado atual.
</specifics>

<deferred>
## Deferred Ideas

- Importacao de planilha e dropdown completo de origem de dados.
- Compartilhamento multiusuario de historicos.
- Auditoria detalhada de imports.
</deferred>

---

*Phase: 02-search-and-config-history-ux*
*Context gathered: 2026-03-31 via PRD Express Path*
