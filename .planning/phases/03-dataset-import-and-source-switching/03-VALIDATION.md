# Phase 03 Validation - Dataset Import and Source Switching

## Automated validation

### Quick gate

```bash
pnpm exec tsc --noEmit
```

Must pass after each plan wave.

### Full production gate

```bash
pnpm build
```

Must pass after the last plan of the phase.

## Manual validation

### Import flow

1. Abrir o controle de origem no header.
2. Importar um arquivo CSV valido com colunas esperadas.
3. Confirmar que uma nova origem aparece com label, data e volume de termos.
4. Confirmar se ela vira ativa conforme o fluxo decidido.

### Failure flow

1. Tentar importar arquivo sem colunas obrigatorias.
2. Tentar importar arquivo com valores numericos invalidos.
3. Confirmar que a UI mostra erro claro.
4. Confirmar que a origem ativa anterior permanece intacta.

### Switching flow

1. Alternar entre origem embarcada e origem importada.
2. Confirmar atualizacao de KPIs, tabela, cluster e consulta.
3. Confirmar reset seguro de termo selecionado quando ele nao existe na nova origem.

## Review checklist

- O parser nao depende de componentes React.
- O registry continua com uma unica origem ativa por vez.
- O dropdown do header nao cresce demais nem polui o topo.
- A metadata exibida ajuda a diferenciar versoes sem exigir leitura longa.

## Phase-specific risks to verify

- Importacao parcial criando estado inconsistente.
- CSV com separador inesperado ou numeros localizados.
- Origens duplicadas gerando labels confusas.
- Termo selecionado persistido apontando para dataset errado apos troca de origem.
