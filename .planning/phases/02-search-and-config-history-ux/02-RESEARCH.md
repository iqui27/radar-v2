# Phase 2: Search and Config History UX - Research

**Researched:** 2026-03-31
**Domain:** dashboard history UX on top of local-first persistence
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

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

### Deferred Ideas (OUT OF SCOPE)
- Importacao de planilha e dropdown completo de origem de dados
- Compartilhamento multiusuario de historicos
- Auditoria detalhada de imports
</user_constraints>

<research_summary>
## Summary

O caminho mais consistente para esta fase e reutilizar as colecoes persistidas da Fase 1, mas enriquecer o historico com snapshots de leitura do termo para evitar comparacoes ambiguas. Em UX, o melhor desenho aqui e usar listas compactas e cards discretos, em vez de abrir novas superfícies pesadas.

Historico de busca e historico de configuracao devem operar como painéis de contexto, nao como protagonistas. O delta de metricas precisa ser compacto e semanticamente claro: sinal, valor anterior, valor atual e origem da comparacao.

**Primary recommendation:** adicionar uma camada pequena de snapshots/comparison helpers e usar componentes compactos na Consulta e Configuracao, mantendo o card principal como centro da leitura.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React state + hooks | existente | orquestrar restore e selecao de historico | ja esta estabelecido no projeto |
| `date-fns` | `4.1.0` | formatacao de timestamps e labels | suficiente para leitura temporal curta |
| local persistence atual | existente | base para searchHistory e configSnapshots | ja entregue na Fase 1 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | existente | evoluir schemas para snapshots comparativos | quando metadata adicional precisar ser persistida |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| listas compactas inline | drawer/modal de historico | aumenta peso visual e quebra leitura rapida |
| delta textual apenas | mini-cards de comparacao | cards ajudam, mas podem poluir se forem grandes demais |
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
lib/
├── radar-history.ts        # comparacao e derivacao de deltas
hooks/
└── use-radar-dashboard.ts  # restore, recordSelection, recordSnapshot metadata
components/dashboard/
├── search-history-panel.tsx
└── config-history-panel.tsx
```

### Pattern 1: Comparison target resolution
**What:** resolver explicitamente qual registro historico e o baseline do termo atual.
**When to use:** card de delta na Consulta.
**Example:**
```ts
const baseline = findPreviousTermSnapshot(term, history)
const delta = baseline ? diffMetrics(current, baseline) : null
```

### Pattern 2: Compact contextual rails
**What:** listas verticais curtas com metadata minima, acao primaria e estado ativo.
**When to use:** historico de busca e historico de configuracao.

### Anti-Patterns to Avoid
- Misturar snapshots de configuracao e busca numa unica lista confusa
- Comparar termo atual com registro historico sem informar a origem do baseline
- Reabrir modais pesados para historico que deveria ser glanceable
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Delta visual complexo | mini-dashboard novo | linha compacta com sinal e baseline | menos poluicao |
| Restore opaco | setState silencioso | restore com metadata e feedback visual | confianca do usuario |
| Busca historica implícita | heuristica difusa | registros com `query`, `selectedTerm`, `createdAt` | comparacao explicavel |

**Key insight:** o historico so ajuda se a comparacao for explicavel. O baseline nao pode ser magico.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Delta sem baseline confiavel
**What goes wrong:** a interface mostra variacao mas o usuario nao entende contra o que.
**Why it happens:** falta de metadado de comparacao.
**How to avoid:** sempre exibir origem temporal/contextual do baseline.
**Warning signs:** delta correto tecnicamente, mas sem narrativa.

### Pitfall 2: Restore muda config mas nao atualiza leitura
**What goes wrong:** snapshot restaura parcialmente e o preview nao acompanha.
**Why it happens:** wiring incompleto entre restore e shell.
**How to avoid:** restore deve passar pelo state container central.
**Warning signs:** valores do painel e KPIs divergem.

### Pitfall 3: Historico rouba foco da consulta
**What goes wrong:** lista grande compete com o card principal.
**Why it happens:** excesso de densidade visual.
**How to avoid:** mostrar ultimos itens + CTA clara, manter escala tipografica baixa.
**Warning signs:** usuario perde o foco do termo atual.
</common_pitfalls>

<open_questions>
## Open Questions

1. **Qual baseline priorizar para os deltas?**
   - What we know: pode ser snapshot anterior de config ou selecao anterior do mesmo termo.
   - What's unclear: ordem exata de precedencia.
   - Recommendation: priorizar mesma combinacao termo+origem; fallback para snapshot de config mais recente.

2. **Quantos itens mostrar por lista sem poluir?**
   - What we know: o usuario quer contexto, nao uma auditoria infinita.
   - What's unclear: limite ideal.
   - Recommendation: renderizar 5-8 itens com scroll interno leve.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `hooks/use-radar-dashboard.ts`
- `components/dashboard/search-panel.tsx`
- `components/dashboard/config-panel.tsx`
- `.planning/phases/01-persistence-and-data-registry/01-VERIFICATION.md`
- `.planning/ROADMAP.md`

### Secondary (MEDIUM confidence)
- `lib/radar-persistence.ts`
- `lib/radar-schemas.ts`
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: history UX over local-first persistence
- Ecosystem: React state, compact dashboard patterns
- Patterns: baseline resolution, restore flow, compact history rails
- Pitfalls: ambiguous deltas, partial restore, visual noise

**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: HIGH
- Code examples: MEDIUM

**Research date:** 2026-03-31
**Valid until:** 2026-04-30
</metadata>

---

*Phase: 02-search-and-config-history-ux*
*Research completed: 2026-03-31*
*Ready for planning: yes*
