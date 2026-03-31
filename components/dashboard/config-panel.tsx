'use client'

import { useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpDown,
  BarChart3,
  Clock3,
  Dot,
  History,
  Percent,
  RotateCcw,
  Save,
  Search,
  Sliders,
  Target,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  enrichTermData,
  getScoreColor,
  getWeight,
  type EnrichedTermData,
  type RadarConfig,
} from '@/lib/radar-data'
import {
  createTermMetricDeltaSet,
  createTermMetricSnapshot,
  type ConfigSnapshotListItem,
  type MetricDeltaValue,
} from '@/lib/radar-history'

interface ConfigPanelProps {
  config: RadarConfig
  configHistory: ConfigSnapshotListItem[]
  data: EnrichedTermData[]
  onConfigChange: (config: RadarConfig) => void
  onRestoreSnapshot: (snapshotId: string) => void
  onDeleteSnapshot: (snapshotId: string) => void
  onSave: () => void
  onReset: () => void
  isDirty: boolean
}

export function ConfigPanel({
  config,
  configHistory,
  data,
  onConfigChange,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onSave,
  onReset,
  isDirty,
}: ConfigPanelProps) {
  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState<'weights' | 'thresholds' | 'bands' | 'ctr'>('weights')
  const [selectedPreviewTerm, setSelectedPreviewTerm] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'term' | 'score' | 'action' | 'position' | 'ctr'>('score')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const filteredData = useMemo(() => {
    const query = search.toLowerCase()
    const visible = search ? data.filter((item) => item.term.toLowerCase().includes(query)) : [...data]

    visible.sort((left, right) => {
      const direction = sortDirection === 'asc' ? 1 : -1

      switch (sortBy) {
        case 'term':
          return left.term.localeCompare(right.term) * direction
        case 'score':
          return (left.score - right.score) * direction
        case 'action':
          return left.action.label.localeCompare(right.action.label) * direction
        case 'position':
          return (left.position - right.position) * direction
        case 'ctr':
          return (left.ctr - right.ctr) * direction
      }
    })

    return visible.slice(0, 50)
  }, [data, search, sortBy, sortDirection])

  const activePreviewTerm = useMemo(() => {
    if (selectedPreviewTerm) {
      return data.find((term) => term.term === selectedPreviewTerm) ?? null
    }

    return filteredData[0] ?? data[0] ?? null
  }, [data, filteredData, selectedPreviewTerm])

  const configComparisons = useMemo(() => {
    if (!activePreviewTerm) {
      return new Map<string, { baseline: EnrichedTermData; deltas: ReturnType<typeof createTermMetricDeltaSet>; currentWeight: number; baselineWeight: number }>()
    }

    const currentSnapshot = createTermMetricSnapshot(activePreviewTerm)
    const currentWeight = getWeight(activePreviewTerm.position, config)

    return new Map(
      configHistory.map((snapshot) => {
        const baseline = enrichTermData([activePreviewTerm], snapshot.config)[0]
        return [
          snapshot.id,
          {
            baseline,
            deltas: createTermMetricDeltaSet(currentSnapshot, createTermMetricSnapshot(baseline)),
            currentWeight,
            baselineWeight: getWeight(activePreviewTerm.position, snapshot.config),
          },
        ]
      })
    )
  }, [activePreviewTerm, config, configHistory])

  const updateWeight = (index: number, value: number) => {
    const nextWeights = [...config.weights]
    nextWeights[index] = value
    onConfigChange({ ...config, weights: nextWeights })
  }

  const updateThreshold = (index: number, value: number) => {
    const nextThresholds = [...config.posThresholds]
    nextThresholds[index] = value
    onConfigChange({ ...config, posThresholds: nextThresholds })
  }

  const updateScoreBand = (index: number, value: number) => {
    const nextBands = [...config.scoreBands]
    nextBands[index] = value
    onConfigChange({ ...config, scoreBands: nextBands })
  }

  const updateExpectedCTR = (position: number, value: number) => {
    const nextExpectedCTR = { ...config.expectedCTR, [position]: value }
    onConfigChange({ ...config, expectedCTR: nextExpectedCTR })
  }

  const toggleSort = (column: 'term' | 'score' | 'action' | 'position' | 'ctr') => {
    if (sortBy === column) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortBy(column)
    setSortDirection(column === 'term' || column === 'action' || column === 'position' ? 'asc' : 'desc')
  }

  const sections = [
    { id: 'weights' as const, label: 'Pesos', icon: Sliders, meta: '3 pesos' },
    { id: 'thresholds' as const, label: 'Limites', icon: Target, meta: '2 cortes' },
    { id: 'bands' as const, label: 'Bandas', icon: BarChart3, meta: '4 zonas' },
    { id: 'ctr' as const, label: 'CTR', icon: Percent, meta: '20 pos' },
  ]

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[312px_minmax(0,1fr)] xl:gap-5 xl:grid-cols-[332px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <div className="radar-toolbar-surface grid grid-cols-4 gap-1 rounded-2xl p-1.5">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                aria-pressed={isActive}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[10px] font-medium transition-[background-color,color,border-color,box-shadow] ${
                  isActive
                    ? 'border-black/8 bg-white text-foreground shadow-[0_8px_20px_-16px_rgba(15,23,42,0.2)] dark:border-white/8 dark:bg-background dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                    : 'border-transparent text-muted-foreground hover:bg-black/[0.035] hover:text-foreground dark:hover:bg-background/45'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[9px] uppercase tracking-[0.14em]">{section.label}</span>
              </button>
            )
          })}
        </div>

        <Card className="radar-panel gap-0 overflow-hidden py-0">
          <CardHeader className="radar-panel-header px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="radar-chip mb-2 inline-flex rounded-full px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Bloco ativo
                </div>
                <CardTitle className="text-sm font-medium tracking-tight">
                  {activeSection === 'weights' && 'Pesos por faixa de posicao'}
                  {activeSection === 'thresholds' && 'Limites de posicao'}
                  {activeSection === 'bands' && 'Bandas de score'}
                  {activeSection === 'ctr' && 'CTR esperado por posicao'}
                </CardTitle>
                <CardDescription className="mt-1 text-[11px] leading-relaxed">
                  {activeSection === 'weights' && 'Contribuicao de cada faixa para o score'}
                  {activeSection === 'thresholds' && 'Onde cada faixa comeca e termina'}
                  {activeSection === 'bands' && 'Limites das acoes recomendadas'}
                  {activeSection === 'ctr' && 'Percentuais de referencia para leitura de posicao'}
                </CardDescription>
              </div>
              <div className="radar-chip rounded-full px-2 py-1 text-[10px] font-medium text-foreground/75">
                {sections.find((section) => section.id === activeSection)?.meta}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {activeSection === 'weights' && (
              <div className="space-y-5">
                <SliderRow
                  label={`Top 1-${config.posThresholds[0]}`}
                  value={config.weights[0]}
                  min={0}
                  max={2}
                  step={0.01}
                  onChange={(value) => updateWeight(0, value)}
                />
                <SliderRow
                  label={`${config.posThresholds[0] + 1}-${config.posThresholds[1]}`}
                  value={config.weights[1]}
                  min={0}
                  max={2}
                  step={0.01}
                  onChange={(value) => updateWeight(1, value)}
                />
                <SliderRow
                  label={`${config.posThresholds[1] + 1}+`}
                  value={config.weights[2]}
                  min={0}
                  max={2}
                  step={0.01}
                  onChange={(value) => updateWeight(2, value)}
                />
              </div>
            )}

            {activeSection === 'thresholds' && (
              <div className="space-y-5">
                <SliderRow
                  label="Fim faixa top"
                  value={config.posThresholds[0]}
                  min={1}
                  max={config.posThresholds[1] - 1}
                  step={1}
                  onChange={(value) => updateThreshold(0, value)}
                  showInteger
                />
                <SliderRow
                  label="Fim faixa media"
                  value={config.posThresholds[1]}
                  min={config.posThresholds[0] + 1}
                  max={20}
                  step={1}
                  onChange={(value) => updateThreshold(1, value)}
                  showInteger
                />
              </div>
            )}

            {activeSection === 'bands' && (
              <div className="space-y-5">
                <SliderRow
                  label="Limite evitar"
                  value={config.scoreBands[0]}
                  min={0}
                  max={config.scoreBands[1] - 0.01}
                  step={0.01}
                  onChange={(value) => updateScoreBand(0, value)}
                  color="#10B981"
                />
                <SliderRow
                  label="Limite avaliar"
                  value={config.scoreBands[1]}
                  min={config.scoreBands[0] + 0.01}
                  max={config.scoreBands[2] - 0.01}
                  step={0.01}
                  onChange={(value) => updateScoreBand(1, value)}
                  color="#6366F1"
                />
                <SliderRow
                  label="Limite testar"
                  value={config.scoreBands[2]}
                  min={config.scoreBands[1] + 0.01}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateScoreBand(2, value)}
                  color="#F59E0B"
                />
                <div className="rounded-2xl border border-border/60 bg-muted/35 p-3 dark:border-white/6 dark:bg-background/30">
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-muted/70 dark:bg-background/80">
                    <div className="bg-[#10B981]" style={{ width: `${config.scoreBands[0] * 100}%` }} />
                    <div className="bg-[#6366F1]" style={{ width: `${(config.scoreBands[1] - config.scoreBands[0]) * 100}%` }} />
                    <div className="bg-[#F59E0B]" style={{ width: `${(config.scoreBands[2] - config.scoreBands[1]) * 100}%` }} />
                    <div className="bg-[#EF4444]" style={{ width: `${(1 - config.scoreBands[2]) * 100}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    <span>Evitar</span>
                    <span>Avaliar</span>
                    <span>Testar</span>
                    <span>Investir</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'ctr' && (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 20 }, (_, index) => index + 1).map((pos) => (
                  <div key={pos} className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/25 px-2.5 py-2 dark:border-white/6 dark:bg-background/25">
                    <span className="w-8 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      #{pos}
                    </span>
                    <Input
                      type="number"
                      min={0.1}
                      max={100}
                      step={0.1}
                      name={`expected-ctr-${pos}`}
                      aria-label={`CTR esperado para a posicao ${pos}`}
                      autoComplete="off"
                      value={config.expectedCTR[pos]}
                      onChange={(event) => updateExpectedCTR(pos, parseFloat(event.target.value) || 0.1)}
                      className="h-7 flex-1 border-border/60 bg-background font-mono text-xs dark:border-white/6 dark:bg-background/40"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            onClick={onSave}
            className="flex-1 rounded-xl bg-primary/85 shadow-[0_16px_30px_-22px_rgba(99,102,241,0.9)]"
            disabled={!isDirty}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Salvar
          </Button>
          <Button variant="outline" onClick={onReset} className="flex-1 rounded-xl border-border/60 bg-card dark:border-white/8 dark:bg-card/60">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Resetar
          </Button>
        </div>

        {isDirty && (
          <p className="text-center text-[10px] uppercase tracking-[0.12em] text-chart-3">
            Alteracoes nao salvas
          </p>
        )}

      </div>
      <div className="min-w-0 space-y-4">
        <Card className="radar-panel min-w-0 gap-0 overflow-hidden py-0">
          <CardHeader className="radar-panel-header px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="pt-[1px]">
                <div className="radar-chip mb-2 inline-flex rounded-full px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Leitura operacional
                </div>
                <CardTitle className="text-sm font-medium tracking-tight">Preview em tempo real</CardTitle>
                <CardDescription className="mt-1 text-[11px]">
                  Primeiros 50 termos recalculados com a configuracao atual
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {activePreviewTerm && (
                  <div className="hidden min-w-0 flex-col items-start gap-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground lg:flex">
                    <span className="text-foreground/70 dark:text-foreground/55">Em foco</span>
                    <span className="max-w-[220px] break-words text-[11px] normal-case tracking-normal text-foreground">
                      {activePreviewTerm.term}
                    </span>
                  </div>
                )}
                <div className="relative w-full max-w-64">
                  <label htmlFor="preview-filter" className="sr-only">
                    Filtrar preview
                  </label>
                  <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="preview-filter"
                    name="preview-filter"
                    aria-label="Filtrar preview em tempo real"
                    autoComplete="off"
                    placeholder="Filtrar termo…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-9 rounded-xl border-border/60 bg-background pl-9 text-xs dark:border-white/8 dark:bg-background/35"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[560px] overflow-auto">
              <table className="min-w-[720px] w-full text-xs">
                <thead className="sticky top-0 z-10 bg-background/96 backdrop-blur-xl dark:bg-background/92">
                  <tr className="border-b border-border/60 dark:border-white/6">
                    <SortableHeader
                      align="left"
                      label="Termo"
                      active={sortBy === 'term'}
                      direction={sortDirection}
                      onClick={() => toggleSort('term')}
                      className="px-5 py-3"
                    />
                    <SortableHeader
                      align="left"
                      label="Score"
                      active={sortBy === 'score'}
                      direction={sortDirection}
                      onClick={() => toggleSort('score')}
                      className="px-4 py-3"
                    />
                    <SortableHeader
                      align="left"
                      label="Acao"
                      active={sortBy === 'action'}
                      direction={sortDirection}
                      onClick={() => toggleSort('action')}
                      className="px-4 py-3"
                    />
                    <SortableHeader
                      align="right"
                      label="Pos"
                      active={sortBy === 'position'}
                      direction={sortDirection}
                      onClick={() => toggleSort('position')}
                      className="px-4 py-3"
                    />
                    <SortableHeader
                      align="right"
                      label="CTR"
                      active={sortBy === 'ctr'}
                      direction={sortDirection}
                      onClick={() => toggleSort('ctr')}
                      className="px-5 py-3"
                    />
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((term) => {
                    const isActive = activePreviewTerm?.term === term.term
                    const scoreColor = getScoreColor(term.score)

                    return (
                      <tr
                        key={term.term}
                        className={`cursor-pointer border-b border-border/50 transition-[background-color,box-shadow] hover:bg-black/[0.025] dark:border-white/6 dark:hover:bg-white/[0.03] ${
                          isActive ? 'bg-primary/[0.09] shadow-[inset_3px_0_0_rgba(99,102,241,0.8)] dark:bg-primary/[0.07]' : ''
                        }`}
                        onClick={() => setSelectedPreviewTerm(term.term)}
                      >
                        <td className="px-5 py-3 font-medium text-foreground/92">{term.term}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentColor]"
                              style={{ backgroundColor: scoreColor }}
                            />
                            <span className="font-mono text-foreground/88">{term.score.toFixed(3)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="rounded-full border px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em]"
                            style={{
                              backgroundColor: `${scoreColor}12`,
                              borderColor: `${scoreColor}18`,
                              color: scoreColor,
                            }}
                          >
                            {term.action.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">{term.position.toFixed(1)}</td>
                        <td className="px-5 py-3 text-right font-mono text-muted-foreground">{term.ctr.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {configHistory.length > 0 && (
          <Card className="radar-panel gap-0 overflow-hidden py-0">
            <CardHeader className="radar-panel-header px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-center gap-2.5">
                  <History className="h-4 w-4 text-primary" />
                  <div>
                    <CardTitle className="text-sm font-medium tracking-tight">Historico de configuracoes</CardTitle>
                    <CardDescription className="text-[11px]">
                      Snapshots em leitura compacta, restore e diff por termo
                    </CardDescription>
                  </div>
                </div>
                {activePreviewTerm && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="radar-chip rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      termo em foco: <span className="font-medium text-foreground">{activePreviewTerm.term}</span>
                    </div>
                    <div className="radar-chip-soft rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      score atual <span className="ml-1 font-medium text-foreground">{activePreviewTerm.score.toFixed(2)}</span>
                    </div>
                    <div className="radar-chip-soft rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      acao <span className="ml-1 font-medium text-foreground">{activePreviewTerm.action.label}</span>
                    </div>
                    <div className="radar-chip-soft rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      ctr esp. <span className="ml-1 font-medium text-foreground">{activePreviewTerm.expCTR.toFixed(2)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {configHistory.map((snapshot) => {
                const comparison = configComparisons.get(snapshot.id)
                const currentBand = activePreviewTerm ? getWeightBandLabel(activePreviewTerm.position, config) : null
                const baselineBand = activePreviewTerm && comparison
                  ? getWeightBandLabel(activePreviewTerm.position, snapshot.config)
                  : null

                return (
                  <div
                    key={snapshot.id}
                    className="rounded-[22px] border border-border/60 bg-white/72 px-4 py-4 transition-[border-color,background-color] hover:border-border hover:bg-white dark:border-white/6 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] dark:hover:border-white/10 dark:hover:bg-background/35"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <p className="text-sm font-medium tracking-tight text-foreground/96">
                            {snapshot.label}
                          </p>
                          {snapshot.isCurrent && (
                            <span className="rounded-full border border-emerald-400/15 bg-emerald-500/8 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-emerald-300">
                              atual
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                            <Clock3 className="h-3 w-3" />
                            {snapshot.relativeLabel}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {snapshot.selectedTerm && (
                            <span className="radar-chip-soft inline-flex items-center gap-1 rounded-full px-2.5 py-1">
                              <Dot className="h-3 w-3" />
                              termo salvo {snapshot.selectedTerm}
                            </span>
                          )}
                          {activePreviewTerm && (
                            <span className="radar-chip-soft inline-flex items-center gap-1 rounded-full px-2.5 py-1">
                              leitura atual {activePreviewTerm.term}
                            </span>
                          )}
                        </div>

                        <div className="grid gap-2.5 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
                          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 dark:border-white/6 dark:bg-background/20">
                            <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">resumo da leitura</p>
                            <div className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
                              {activePreviewTerm && comparison ? (
                                <>
                                  <div className="flex items-center justify-between gap-3">
                                    <span>Score atual</span>
                                    <span className="font-mono text-foreground">{activePreviewTerm.score.toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span>Score no snapshot</span>
                                    <span className="font-mono text-foreground">{comparison.baseline.score.toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span>Acao</span>
                                    <span className="text-foreground">{comparison.baseline.action.label} → {activePreviewTerm.action.label}</span>
                                  </div>
                                </>
                              ) : (
                                <span>Selecione um termo na tabela para comparar a leitura.</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                          {activePreviewTerm && comparison && (
                            <>
                              <ConfigDeltaPill label="Score" delta={comparison.deltas.score} precision={2} />
                              <ConfigDeltaPill label="CTR" delta={comparison.deltas.ctr} precision={2} suffix="%" />
                              <ConfigChangePill
                                label="Acao"
                                before={comparison.baseline.action.label}
                                after={activePreviewTerm.action.label}
                              />
                              <ConfigChangePill
                                label="CTR esperado"
                                before={`${comparison.baseline.expCTR.toFixed(2)}%`}
                                after={`${activePreviewTerm.expCTR.toFixed(2)}%`}
                              />
                              {baselineBand && currentBand && (
                                <ConfigChangePill
                                  label="Faixa"
                                  before={baselineBand}
                                  after={currentBand}
                                />
                              )}
                              <ConfigChangePill
                                label="Peso"
                                before={comparison.baselineWeight.toFixed(2)}
                                after={comparison.currentWeight.toFixed(2)}
                              />
                            </>
                          )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant={snapshot.isCurrent ? 'secondary' : 'outline'}
                          size="sm"
                          className="rounded-xl border-border/60 bg-background dark:border-white/8 dark:bg-background/35"
                          disabled={snapshot.isCurrent}
                          onClick={() => onRestoreSnapshot(snapshot.id)}
                        >
                          Restaurar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-rose-500/8 hover:text-rose-300"
                          onClick={() => onDeleteSnapshot(snapshot.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Apagar snapshot</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  showInteger = false,
  color,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  showInteger?: boolean
  color?: string
}) {
  return (
    <div className="rounded-2xl border border-white/6 bg-background/20 px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="font-mono text-xs font-semibold" style={color ? { color } : undefined}>
          {showInteger ? value : value.toFixed(2)}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next)} className="w-full" />
    </div>
  )
}

function SortableHeader({
  label,
  active,
  direction,
  align,
  className,
  onClick,
}: {
  label: string
  active: boolean
  direction: 'asc' | 'desc'
  align: 'left' | 'right'
  className?: string
  onClick: () => void
}) {
  return (
    <th className={className}>
      <button
        type="button"
        onClick={onClick}
        className={`group inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors ${
          align === 'right' ? 'ml-auto flex' : 'flex'
        } ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/88'}`}
      >
        <span>{label}</span>
        <ArrowUpDown className={`h-3 w-3 transition-opacity ${active ? 'opacity-100' : 'opacity-35 group-hover:opacity-70'}`} />
        {active && <span className="text-[9px] text-muted-foreground/75">{direction === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  )
}

function ConfigDeltaPill({
  label,
  delta,
  precision,
  suffix = '',
}: {
  label: string
  delta: MetricDeltaValue
  precision: number
  suffix?: string
}) {
  const isPositive = delta.direction === 'up'
  const isNeutral = delta.direction === 'flat'
  const textColor = isNeutral
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-emerald-300'
      : 'text-rose-300'
  const bgColor = isNeutral
    ? 'bg-background/25'
    : isPositive
      ? 'bg-emerald-500/10'
      : 'bg-rose-500/10'

  return (
    <div className={`inline-flex min-w-[86px] flex-col rounded-xl border border-border/60 px-2.5 py-2 dark:border-white/6 ${bgColor}`}>
      <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={`text-[13px] font-semibold ${textColor}`}>
          {isNeutral ? '0.00' : `${delta.change > 0 ? '+' : ''}${delta.change.toFixed(precision)}`}
          {suffix}
        </span>
      </div>
      <span className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-muted-foreground/80">vs snapshot</span>
    </div>
  )
}

function ConfigChangePill({
  label,
  before,
  after,
}: {
  label: string
  before: string
  after: string
}) {
  const changed = before !== after

  return (
    <div
      className={`inline-flex min-w-[132px] flex-col rounded-xl border px-2.5 py-2 ${
        changed ? 'border-primary/14 bg-primary/[0.07]' : 'border-border/60 bg-muted/25 dark:border-white/6 dark:bg-background/20'
      }`}
    >
      <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
        <span className="text-muted-foreground">{before}</span>
        <ArrowRight className={`h-3 w-3 ${changed ? 'text-primary/90' : 'text-muted-foreground/60'}`} />
        <span className={changed ? 'font-medium text-foreground' : 'text-muted-foreground'}>{after}</span>
      </div>
      <span className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-muted-foreground/80">
        {changed ? 'mudanca aplicada' : 'sem alteracao'}
      </span>
    </div>
  )
}

function getWeightBandLabel(position: number, config: RadarConfig) {
  if (position <= config.posThresholds[0]) return `Top 1-${config.posThresholds[0]}`
  if (position <= config.posThresholds[1]) return `${config.posThresholds[0] + 1}-${config.posThresholds[1]}`
  return `${config.posThresholds[1] + 1}+`
}
