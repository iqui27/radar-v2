'use client'

import { useState, useMemo } from 'react'
import {
  BarChart3,
  Clock3,
  History,
  Percent,
  RotateCcw,
  Save,
  Search,
  Sliders,
  Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import type { RadarConfig, EnrichedTermData } from '@/lib/radar-data'
import type { ConfigSnapshotListItem } from '@/lib/radar-history'
import { getScoreColor } from '@/lib/radar-data'

interface ConfigPanelProps {
  config: RadarConfig
  configHistory: ConfigSnapshotListItem[]
  data: EnrichedTermData[]
  onConfigChange: (config: RadarConfig) => void
  onRestoreSnapshot: (snapshotId: string) => void
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
  onSave,
  onReset,
  isDirty,
}: ConfigPanelProps) {
  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState<'weights' | 'thresholds' | 'bands' | 'ctr'>('weights')

  const filteredData = useMemo(() => {
    if (!search) return data.slice(0, 50)
    const query = search.toLowerCase()
    return data.filter(d => d.term.toLowerCase().includes(query)).slice(0, 50)
  }, [data, search])

  const updateWeight = (index: number, value: number) => {
    const newWeights = [...config.weights]
    newWeights[index] = value
    onConfigChange({ ...config, weights: newWeights })
  }

  const updateThreshold = (index: number, value: number) => {
    const newThresholds = [...config.posThresholds]
    newThresholds[index] = value
    onConfigChange({ ...config, posThresholds: newThresholds })
  }

  const updateScoreBand = (index: number, value: number) => {
    const newBands = [...config.scoreBands]
    newBands[index] = value
    onConfigChange({ ...config, scoreBands: newBands })
  }

  const updateExpectedCTR = (position: number, value: number) => {
    const newExpectedCTR = { ...config.expectedCTR, [position]: value }
    onConfigChange({ ...config, expectedCTR: newExpectedCTR })
  }

  const sections = [
    { id: 'weights' as const, label: 'Pesos', icon: Sliders },
    { id: 'thresholds' as const, label: 'Limites', icon: Target },
    { id: 'bands' as const, label: 'Bandas', icon: BarChart3 },
    { id: 'ctr' as const, label: 'CTR Esperado', icon: Percent },
  ]

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[420px_minmax(0,1fr)]">
      {/* Left Panel - Controls */}
      <div className="space-y-4 min-w-0">
        {/* Section Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                type="button"
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                aria-pressed={activeSection === section.id}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-[10px] font-medium transition-[background-color,color,box-shadow] ${
                  activeSection === section.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{section.label}</span>
              </button>
            )
          })}
        </div>

        {/* Config Card */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/30 bg-muted/20 px-4 py-3">
            <CardTitle className="text-sm font-medium">
              {activeSection === 'weights' && 'Pesos por Faixa de Posicao'}
              {activeSection === 'thresholds' && 'Limites de Posicao'}
              {activeSection === 'bands' && 'Bandas de Score'}
              {activeSection === 'ctr' && 'CTR Esperado por Posicao'}
            </CardTitle>
            <CardDescription className="text-xs">
              {activeSection === 'weights' && 'Contribuicao de cada faixa para o score'}
              {activeSection === 'thresholds' && 'Onde cada faixa comeca e termina'}
              {activeSection === 'bands' && 'Limites das acoes recomendadas'}
              {activeSection === 'ctr' && 'Percentuais de referencia (1-20)'}
            </CardDescription>
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
                  onChange={(v) => updateWeight(0, v)}
                />
                <SliderRow
                  label={`${config.posThresholds[0] + 1}-${config.posThresholds[1]}`}
                  value={config.weights[1]}
                  min={0}
                  max={2}
                  step={0.01}
                  onChange={(v) => updateWeight(1, v)}
                />
                <SliderRow
                  label={`${config.posThresholds[1] + 1}+`}
                  value={config.weights[2]}
                  min={0}
                  max={2}
                  step={0.01}
                  onChange={(v) => updateWeight(2, v)}
                />
              </div>
            )}

            {activeSection === 'thresholds' && (
              <div className="space-y-5">
                <SliderRow
                  label="Fim faixa Top"
                  value={config.posThresholds[0]}
                  min={1}
                  max={config.posThresholds[1] - 1}
                  step={1}
                  onChange={(v) => updateThreshold(0, v)}
                  showInteger
                />
                <SliderRow
                  label="Fim faixa Media"
                  value={config.posThresholds[1]}
                  min={config.posThresholds[0] + 1}
                  max={20}
                  step={1}
                  onChange={(v) => updateThreshold(1, v)}
                  showInteger
                />
              </div>
            )}

            {activeSection === 'bands' && (
              <div className="space-y-5">
                <SliderRow
                  label="Limite Evitar"
                  value={config.scoreBands[0]}
                  min={0}
                  max={config.scoreBands[1] - 0.01}
                  step={0.01}
                  onChange={(v) => updateScoreBand(0, v)}
                  color="#10B981"
                />
                <SliderRow
                  label="Limite Avaliar"
                  value={config.scoreBands[1]}
                  min={config.scoreBands[0] + 0.01}
                  max={config.scoreBands[2] - 0.01}
                  step={0.01}
                  onChange={(v) => updateScoreBand(1, v)}
                  color="#6366F1"
                />
                <SliderRow
                  label="Limite Testar"
                  value={config.scoreBands[2]}
                  min={config.scoreBands[1] + 0.01}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateScoreBand(2, v)}
                  color="#F59E0B"
                />
                {/* Visual band preview */}
                <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                  <div className="bg-[#10B981]" style={{ width: `${config.scoreBands[0] * 100}%` }} />
                  <div className="bg-[#6366F1]" style={{ width: `${(config.scoreBands[1] - config.scoreBands[0]) * 100}%` }} />
                  <div className="bg-[#F59E0B]" style={{ width: `${(config.scoreBands[2] - config.scoreBands[1]) * 100}%` }} />
                  <div className="bg-[#EF4444]" style={{ width: `${(1 - config.scoreBands[2]) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Evitar</span>
                  <span>Avaliar</span>
                  <span>Testar</span>
                  <span>Investir</span>
                </div>
              </div>
            )}

            {activeSection === 'ctr' && (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 20 }, (_, i) => i + 1).map((pos) => (
                  <div key={pos} className="flex items-center gap-2">
                    <span className="w-8 text-[10px] text-muted-foreground">#{pos}</span>
                    <Input
                      type="number"
                      min={0.1}
                      max={100}
                      step={0.1}
                      name={`expected-ctr-${pos}`}
                      aria-label={`CTR esperado para a posicao ${pos}`}
                      autoComplete="off"
                      value={config.expectedCTR[pos]}
                      onChange={(e) => updateExpectedCTR(pos, parseFloat(e.target.value) || 0.1)}
                      className="h-7 flex-1 border-border/50 font-mono text-xs"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onSave}
            className="flex-1"
            disabled={!isDirty}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Salvar
          </Button>
          <Button variant="outline" onClick={onReset} className="flex-1">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Resetar
          </Button>
        </div>

        {isDirty && (
          <p className="text-center text-[10px] text-chart-3">
            Alteracoes nao salvas
          </p>
        )}

        {configHistory.length > 0 && (
          <Card className="border-border/50 bg-card/70">
            <CardHeader className="border-b border-border/30 bg-muted/15 px-4 py-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <div>
                  <CardTitle className="text-sm font-medium">Historico de configuracoes</CardTitle>
                  <CardDescription className="text-xs">
                    Snapshots gerados a cada salvamento com restore rapido
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {configHistory.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="rounded-2xl border border-border/40 bg-background/35 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium tracking-tight text-foreground">
                          {snapshot.label}
                        </p>
                        {snapshot.isCurrent && (
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-emerald-300">
                            atual
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {snapshot.relativeLabel}
                        </span>
                        {snapshot.selectedTerm && (
                          <span className="truncate">Termo: {snapshot.selectedTerm}</span>
                        )}
                      </div>
                      {snapshot.termSnapshot && (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Score {snapshot.termSnapshot.score.toFixed(2)} • CTR {snapshot.termSnapshot.ctr.toFixed(2)}% • Pos {snapshot.termSnapshot.position.toFixed(1)}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant={snapshot.isCurrent ? 'secondary' : 'outline'}
                      size="sm"
                      className="shrink-0"
                      disabled={snapshot.isCurrent}
                      onClick={() => onRestoreSnapshot(snapshot.id)}
                    >
                      Restaurar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Panel - Preview Table */}
      <Card className="min-w-0 overflow-hidden border-border/50">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">Preview em Tempo Real</CardTitle>
              <CardDescription className="text-xs">
                Primeiros 50 termos com configuracao atual
              </CardDescription>
            </div>
            <div className="relative w-full max-w-64">
              <label htmlFor="preview-filter" className="sr-only">
                Filtrar preview
              </label>
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="preview-filter"
                name="preview-filter"
                aria-label="Filtrar preview em tempo real"
                autoComplete="off"
                placeholder="Filtrar…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 border-border/50 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-auto">
            <table className="min-w-[720px] w-full text-xs">
              <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b border-border/30">
                  <th className="px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Termo</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Score</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Acao</th>
                  <th className="px-3 py-2.5 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Pos</th>
                  <th className="px-3 py-2.5 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">CTR</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((d) => (
                  <tr
                    key={d.term}
                    className="border-b border-border/20 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-3 py-2 font-medium">{d.term}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: getScoreColor(d.score) }}
                        />
                        <span className="font-mono">{d.score.toFixed(3)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                        style={{ 
                          backgroundColor: `${getScoreColor(d.score)}15`,
                          color: getScoreColor(d.score)
                        }}
                      >
                        {d.action.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground">{d.position.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground">{d.ctr.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span 
          className="font-mono text-xs font-semibold"
          style={color ? { color } : undefined}
        >
          {showInteger ? value : value.toFixed(2)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  )
}
