# Conventions

## General Code Style
- componentes usam função nomeada com `export function`
- forte uso de `useMemo`, `useEffect`, `useCallback` onde há derivação de estado e eventos
- classes Tailwind extensas inline, sem extração sistemática para helpers visuais
- strings de UI e labels estão majoritariamente em português
- código e nomes técnicos permanecem em inglês

## Import Style
- alias `@/` usado para imports internos
- bibliotecas externas primeiro, depois imports internos
- tipos frequentemente importados com `type`

## State and Derivation
- dados derivados são calculados com `useMemo`
- handlers com side effects simples usam `useCallback`
- o padrão predominante é lifting state up para `components/dashboard/index.tsx`
- não existe store global com Zustand, Redux ou Context de domínio

## Styling Conventions
- classes utilitárias descritivas direto no JSX
- uso recorrente de transparência, blur, borders sutis e gradients tonais
- `bg-card`, `bg-muted`, `border-border/50`, `text-muted-foreground` aparecem como base visual comum

## Interaction Patterns
- busca com dropdown local em `components/dashboard/search-panel.tsx`
- toggles de visualização feitos com botões simples e `aria-pressed`
- modais e overlays usam wrappers Radix
- tabelas são clicáveis por linha/termo, não por navegação roteada

## Domain Conventions
- score RADAR sempre varia de `0..1`
- ação derivada por `scoreBands`
- cor da ação vem de `getScoreColor`
- cluster semântico é inferido por similaridade textual simples, não por embedding

## Validation / Safety Gaps
- `ConfigPanel` altera config sem schema validation forte
- não há guardrails de persistência nem versionamento antes de salvar
- restauração de config ainda não existe
- origem dos dados ainda é singleton, sem contrato tipado para múltiplas versões

## Recommended Conventions for Next Phase
- toda mutação persistida deve gerar snapshot com metadata
- data source deve ter `id`, `label`, `createdAt`, `kind`, `recordCount`
- histórico de busca deve ser append-only com timestamp e origem dos dados
- comparação histórica deve usar snapshots explícitos, não recomputação implícita
