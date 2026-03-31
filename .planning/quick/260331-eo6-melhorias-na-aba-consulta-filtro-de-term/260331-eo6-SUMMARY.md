---
phase: quick
plan: "01"
subsystem: dashboard
tags: [brand-filter, semantic-clustering, cluster-visualization, scatter-plot]
dependency_graph:
  requires: []
  provides: []
  affects: [search-panel, scatter-chart, radar-data]
tech_stack:
  added: [ngram-similarity, levenshtein-distance, cluster-colors-palette]
  patterns: [semantic-clustering, cluster-scatter]
key_files:
  created: []
  modified:
    - components/dashboard/search-panel.tsx
    - components/dashboard/scatter-chart.tsx
    - lib/radar-data.ts
decisions:
  - Semantic similarity: ngram overlap (70%) + edit distance (30%)
  - Cluster colors: 12 distinct colors palette
  - Brand filter: include/exclude BB checkboxes
  - Cluster summary: shown after badge in header
metrics:
  duration: "~5 min"
  completed: "2026-03-31T13:50:00.000Z"
  commits: 3
  files_changed: 4
---

# Phase Quick Plan 01: Melhorias na aba consulta

## One-liner

Implemented brand filter with include/exclude BB checkboxes, semantic clustering using n-gram overlap + Levenshtein distance, cluster summary display, cluster terms box, clusterized scatter plot, metrics modal, and related clusters UI.

## Summary

Executed 3 tasks implementing 8 improvements to the "consulta" tab of the radar analytics dashboard:

1. **Brand filter + Reorder metrics**
   - Added `BrandFilter` state with `includeBB`/`excludeBB` checkboxes
   - Filter dropdown appears near available terms counter
   - Brand filter applied before passing data to TermCluster
   - Reordered stats: Impressoes first, then Posicao, CTR, Cliques

2. **Semantic clustering + Cluster summary + Terms box**
   - Added n-gram overlap and Levenshtein distance helpers
   - Modified `getRelatedTerms()` to use semantic similarity: `ngramOverlap * 0.7 + editDistance * 0.3`
   - Added `clusterId` field to `EnrichedTermData` interface
   - Added `assignClusterIds()`, `getRelatedClusters()`, `getClusterTerms()` functions
   - Added cluster summary after badge: "Cluster #X | Y termos | Score medio | CTR"
   - Added collapsible "Termos do cluster" section with all cluster terms
   - Selected term highlighted with colored border

3. **Scatter by cluster + Metrics modal + Related clusters**
   - Scatter chart now colors by `clusterId` instead of score/action
   - 12 distinct colors palette for clusters
   - Legend shows "Cluster 1", "Cluster 2", etc.
   - Replaced related terms pills with "Clusters relacionados" expandable badges
   - Dialog shows full metrics grid: Termo, Pos, CTR, Score with font-mono numbers

## Success Criteria

- [x] Filtro de marca (dropdown com incluir/excluir BB) está visível e filtra termos
- [x] Impressões é a primeira métrica no card do termo analisado
- [x] Clustering é semântico (n-gram + edit distance)
- [x] TermAnalysisCard mostra resumo do cluster e box com termos
- [x] Scatter plot usa cores por cluster
- [x] Modal de termos relacionados mostra métricas (Position, CTR, Clicks, Impressoes)
- [x] UI mostra clusters relacionados ao invés de apenas termos relacionados

## Commits

- `04f2ec0` feat(quick-260331-eo6): add brand filter and reorder metrics
- `361b2b1` feat(quick-260331-eo6): implement semantic clustering and cluster UI
- `03fa918` feat(quick-260331-eo6): scatter by cluster, metrics modal, related clusters

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.
