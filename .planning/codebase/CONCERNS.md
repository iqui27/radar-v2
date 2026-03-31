# Concerns

## 1. No Persistence Layer
- histórico de busca pedido pelo usuário ainda não existe.
- histórico de configuração com restore também não existe.
- seleção de origem de dados e versionamento de imports ainda não existem.
- sem uma camada de persistência central, esses recursos podem ser implementados de forma fragmentada e frágil.

## 2. Synthetic Time Filtering
- `filterRadarDataByDateRange` em `lib/radar-data.ts` gera períodos por simulação.
- isso é útil para protótipo visual, mas pode conflitar com a futura leitura histórica real.
- ao chegar importação de dados versionados, haverá risco de misturar “histórico real” com “drift sintético”.

## 3. Configuration Safety
- `ConfigPanel` altera valores diretamente no estado principal.
- não existe validação formal para garantir invariantes além do range do slider/input.
- não há distinção entre draft, saved config e snapshot restaurado.

## 4. Dashboard Shell Becoming Too Heavy
- `components/dashboard/index.tsx` já concentra coordenação de período, tema, tabs, seleção, config e visão de panorama.
- as pendências novas adicionam:
  - histórico de busca
  - histórico de configuração
  - fontes/versionamento de dados
  - comparação histórica por termo
- isso sugere necessidade de extrair state domain/store.

## 5. Imported Dataset Scale
- a base atual já tem 1000 termos em `lib/radar-data-source.ts`.
- novas importações podem crescer rápido e impactar render, memória e experiência.
- será importante manter sampling no scatter, paginação/virtualização e limites de render.

## 6. No Tests for Core Domain
- a lógica mais sensível do produto está em `lib/radar-data.ts`.
- qualquer mudança em score, snapshots ou comparação histórica sem testes tende a introduzir regressão difícil de notar.

## 7. Local-Only Product Boundary
- a base atual é efetivamente single-user e local.
- se o cliente esperar histórico confiável entre sessões/máquinas, será necessário backend posterior.
- para a próxima fase, vale deixar explícito que a primeira implementação é local-first.
