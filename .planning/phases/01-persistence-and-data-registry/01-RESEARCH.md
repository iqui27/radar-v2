# Phase 1: Persistence and Data Registry - Research

**Researched:** 2026-03-31
**Domain:** local-first dashboard persistence, typed snapshots, versioned data source registry
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- A primeira implementacao deve funcionar sem backend.
- Toda configuracao salva deve virar snapshot restauravel.
- O dataset embutido atual precisa virar a origem inicial dentro de um registry versionado.
- O dashboard inteiro deve passar a consumir a origem de dados ativa.
- A base visual atual nao pode sofrer regressao grande durante a migracao.

### the agent's Discretion
- Formato interno dos modelos persistidos.
- Estrategia de store local do dashboard.
- Separacao entre helpers de schema, persistence e selecao de dados.
- Quanto da UI atual precisa mudar nesta fase versus ficar para as fases 2 e 3.

### Deferred Ideas (OUT OF SCOPE)
- UX completa de historico no dashboard
- Comparacao visual detalhada de metricas no card historico
- Importacao de planilha com parser e feedback de erro
</user_constraints>

<research_summary>
## Summary

Para este brownfield, a abordagem mais segura e criar uma camada local-first pequena, tipada e isolada do JSX, em vez de espalhar `localStorage` e ad hoc JSON parsing pelos componentes. O dashboard ja tem um nucleo de dominio forte em `lib/radar-data.ts`; o trabalho certo aqui e envolver esse nucleo com contratos persistidos e um registry de origem ativa.

O padrao recomendado e usar schemas `zod` para validar snapshots restaurados, um adaptador de persistence com versionamento simples e um state container local do dashboard para centralizar config atual, config salva, data source ativa e snapshots. Isso reduz regressao e prepara bem as fases 2 e 3.

**Primary recommendation:** Criar schemas + adapters de persistence primeiro, depois migrar o dashboard para consumir um registry tipado de config e data source.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | `^3.24.1` | validar snapshots e payloads persistidos | ja esta instalado e reduz corrupcao silenciosa |
| `React state + hooks` | existente | orquestrar estado do dashboard | suficiente para local-first sem trazer outro store ainda |
| `localStorage` | browser API | persistir config/history/source registry | atende prototipo local sem backend |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | `4.1.0` | timestamps e labels de snapshot | ao renderizar metadata e ordenacao temporal |
| `react-hook-form` | instalado | formularios mais complexos no futuro | util se a configuracao crescer alem de sliders simples |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `localStorage` direto | IndexedDB | mais robusto, mas desnecessario nesta fase |
| hooks locais espalhados | Zustand | melhora escalabilidade, mas aumenta mudanca estrutural cedo |

**Installation:**
```bash
# Nenhuma dependencia nova obrigatoria nesta fase
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
lib/
├── radar-data.ts             # scoring e enrichment
├── radar-persistence.ts      # adapters local-first
├── radar-schemas.ts          # zod schemas e migrations leves
└── radar-data-sources.ts     # registry de origens e metadata
hooks/
└── use-radar-dashboard.ts    # state container do dashboard
```

### Pattern 1: Versioned snapshot envelope
**What:** persistir payloads com `version`, `createdAt`, `id` e metadata.
**When to use:** config snapshots, search history entries e data source registry.
**Example:**
```ts
type PersistedEnvelope<T> = {
  version: 1
  id: string
  createdAt: string
  payload: T
}
```

### Pattern 2: Bootstrap defaults + safe hydration
**What:** iniciar com defaults do app e tentar hidratar persistence validada.
**When to use:** config inicial, dataset ativo e listas de snapshot.
**Example:**
```ts
const state = readPersistedState() ?? createDefaultState()
```

### Anti-Patterns to Avoid
- **`localStorage` em varios componentes:** espalha parsing, quebra consistencia e dificulta migracao.
- **Persistir objetos sem schema/version:** qualquer mudanca de shape quebra restore silenciosamente.
- **Acoplar origem ativa a `RADAR_DATA` diretamente:** impede trocar dataset sem refatorar tudo depois.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Validacao de snapshot | checks manuais em cascata | `zod` schemas | menos bug e melhor migracao |
| Timestamp / labels | formatador proprio | `date-fns` | sem edge cases de locale |
| Estado global crescente | props drilling profundo | hook container unico do dashboard | menor regressao no brownfield |

**Key insight:** o risco aqui nao e algoritmo complexo; e drift entre estado em memoria, snapshots e origem ativa. Tipagem e validacao ganham mais que infra pesada.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Restoring stale config against new dataset
**What goes wrong:** restaurar configuracao antiga sem metadata faz comparacoes historicas perderem contexto.
**Why it happens:** snapshots sem associacao com origem ativa ou termo selecionado.
**How to avoid:** salvar metadata minima no snapshot.
**Warning signs:** restore funciona mas delta exibido nao faz sentido.

### Pitfall 2: Source switch only updates table
**What goes wrong:** parte do dashboard troca de dataset e outra continua usando o antigo.
**Why it happens:** derivacoes espalhadas fora de um ponto central.
**How to avoid:** derivar tudo a partir de `activeDataSource` no shell/store.
**Warning signs:** KPI, cluster e tabela divergem apos troca.

### Pitfall 3: Persistence corruption on shape change
**What goes wrong:** JSON salvo antes da mudanca quebra hydration depois.
**Why it happens:** ausencia de `version` e fallback de migracao.
**How to avoid:** envelope versionado + fallback para defaults.
**Warning signs:** parse falha ou campos ficam `undefined` apos reload.
</common_pitfalls>

<open_questions>
## Open Questions

1. **O historico de busca deve registrar apenas termos selecionados ou tambem queries digitadas sem selecao?**
   - What we know: o usuario pediu "historico do que foi procurado".
   - What's unclear: nivel exato de granularidade.
   - Recommendation: salvar ambos, mas diferenciar `query` de `selection`.

2. **Quantos snapshots manter localmente por categoria?**
   - What we know: historico e restore sao centrais.
   - What's unclear: limite pratico.
   - Recommendation: comecar com cap em memoria/persistencia por lista, ex. 50 ou 100 entradas.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `lib/radar-data.ts` - scoring, enrichment e dependencias de dominio atuais
- `components/dashboard/index.tsx` - shell e ownership de estado atual
- `components/dashboard/config-panel.tsx` - fluxo atual de save/reset
- `.planning/codebase/*.md` - mapa brownfield recem-gerado

### Secondary (MEDIUM confidence)
- `package.json` - dependencias disponiveis para implementar sem instalar mais nada nesta fase
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: persistence local-first com validacao tipada
- Ecosystem: React state, zod, browser storage
- Patterns: snapshot envelope, active registry, safe hydration
- Pitfalls: inconsistencia de source, restore e drift historico

**Confidence breakdown:**
- Standard stack: HIGH - baseado no que ja esta instalado
- Architecture: HIGH - alinhado ao brownfield atual
- Pitfalls: HIGH - derivados diretamente das pendencias do usuario
- Code examples: MEDIUM - exemplos simplificados e internos

**Research date:** 2026-03-31
**Valid until:** 2026-04-30
</metadata>

---

*Phase: 01-persistence-and-data-registry*
*Research completed: 2026-03-31*
*Ready for planning: yes*
