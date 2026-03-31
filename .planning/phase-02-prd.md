# Phase 2 PRD - Search and Config History UX

## Objective

Transformar a fundacao persistida da Fase 1 em uma experiencia legivel de historico no dashboard, com foco em contexto decisorio. O usuario deve conseguir revisar buscas recentes, snapshots de configuracao e a variacao das metricas de um termo em relacao a momentos anteriores.

## Scope

- Exibir historico de buscas e termos selecionados na aba Consulta.
- Exibir historico de configuracoes salvas com metadata clara e botao de restaurar.
- Mostrar deltas de metricas do termo selecionado em relacao ao snapshot/historico anterior.
- Manter a experiencia compacta, bonita e minimalista, sem poluir o card principal.

## Functional Requirements

1. A aba Consulta deve exibir historico recente de buscas e selecoes com timestamp.
2. O usuario deve poder clicar em um item do historico de busca para recuperar contexto.
3. O painel de Configuracao deve exibir snapshots salvos em ordem cronologica.
4. Cada snapshot deve oferecer restauracao da configuracao salva.
5. Ao selecionar um termo, o dashboard deve exibir delta de score, posicao, CTR, cliques e impressoes versus contexto anterior aplicavel.
6. O card historico deve deixar claro se a comparacao foi feita contra:
   - snapshot anterior de configuracao
   - selecao anterior do mesmo termo
7. O sistema deve capturar metadata suficiente para comparacoes futuras sem depender apenas do estado atual em memoria.

## Non-Goals

- Nao implementar ainda importacao de planilha.
- Nao implementar ainda o dropdown final de troca de origem de dados.
- Nao introduzir backend ou sincronizacao entre usuarios.

## UX / Product Notes

- O historico de busca deve ser discreto, de leitura rapida, e nao competir com o cluster.
- O historico de configuracao deve lembrar o dashboard antigo, mas com visual mais limpo.
- O delta de metricas deve usar sinais compactos e explicitos, evitando excesso de cards.
- Restaurar configuracao deve ser seguro e previsivel.

## Acceptance Criteria

- Existe um componente de historico de busca funcional na Consulta.
- Existe um historico restauravel de configuracao no painel de Configuracao.
- Ao selecionar um termo, o usuario ve deltas em relacao ao estado anterior relevante.
- `pnpm exec tsc --noEmit` e `pnpm build` continuam verdes.
