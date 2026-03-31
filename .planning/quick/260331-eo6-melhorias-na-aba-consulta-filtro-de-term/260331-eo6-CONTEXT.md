# Quick Task 260331-eo6: Melhorias na aba consulta - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Task Boundary

Melhorias na aba consulta:
- Opção de filtrar termos de marca (incluir/remover BB ou variantes)
- Melhorar o agrupamento dos termos 
- No "termo analisado" trazer um resumo do cluster.
- Adicionar box mostrando os termos que estão dentro do cluster
- Incluir impressões como a primeira métrica no quadro do termo analisado
- Scatter ser clusterizado
- incluir modal nos termos relacionados mostrando as métricas de cada termo
- No lugar de termos relacionados, poderíamos trazer clusters relacionados.

</domain>

<decisions>
## Implementation Decisions

### Filtro de Marca
- Interface: A definir - usuário pediu para analisar o que é mais intuitivo antes de decidir
- Agente tem liberdade para escolher a melhor abordagem baseado em análise do projeto existente

### Agrupamento de Termos
- Recomendado: Similaridade semântica (embeddings) para clusterização
- Justificativa: Mais significativo para análise de termos, robusto para termos novos, descobre relações não óbvias
- Ajustável baseado nos dados reais durante implementação

### Visualização do Cluster
- A definir - usuário pediu para verificar o que já existe no projeto antes de propor mudanças
- Agente deve analisar implementação existente

### Clusters Relacionados
- Lógica a definir - usuário pediu para analisar o que melhor se encaixa na proposta
- Agente tem liberdade para definir baseado na implementação

### Agente's Discretion
- Filtro de marca: agente decide interface mais intuitiva
- Visualização cluster: agente verifica projeto existente e propem melhor abordagem
- Clusters relacionados: agente define lógica baseada na proposta

</decisions>

<specifics>
## Specific Ideas

- Impressões deve ser a primeira métrica no quadro do termo analisado
- Scatter plot deve ser clusterizado (cores por cluster)
- Modal para métricas de termos relacionados
- Box mostrando termos dentro do cluster

</specifics>

<canonical_refs>
## Canonical References

**Análise do projeto existente:**

### Arquivos principais
- `components/dashboard/search-panel.tsx` - Consulta tab (SearchPanel)
- `components/dashboard/term-cluster.tsx` - Cluster visualization
- `components/dashboard/scatter-chart.tsx` - Scatter plot (recharts)
- `lib/radar-data.ts` - Clustering logic (getRelatedTerms)

### Estado atual
- **Clustering:** Similaridade word-based simples (substring match), NÃO semântico
- **Scatter colors:** Por action (Evitar/Avaliar/Testar/Investir), NÃO por cluster
- **Métricas no termo analisado:** Position → CTR → Clicks → Impressions (Impressões é a 4a)
- **Termos relacionados:** Pílulas clicáveis + Dialog para ver mais
- **Filtro de marca:** NÃO existe atualmente

### Decisões confirmadas após análise
- Clustering semântico: Manter como direção, mas verificar se há infrastructure embeddings no projeto
- Visualização cluster: Verificar term-cluster.tsx existente antes de propor
- Filtro de marca: Dropdown com checkboxes parece mais intuitivo (recomendado)
- Scatter clusterizado: Usar cores por cluster em vez de por action

</canonical_refs>
