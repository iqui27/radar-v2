'use client'

import { useMemo, useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ZAxis,
  ReferenceLine,
} from 'recharts'
import { Check, X, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { EnrichedTermData } from '@/lib/radar-data'
import { formatNumber, getClusterStats, getScoreColor } from '@/lib/radar-data'

interface ScatterChartProps {
  data: EnrichedTermData[]
  highlightTerm?: string
  onHighlightTermChange?: (term: string | null) => void
}

const MAX_SCATTER_TERMS = 240

const CLUSTER_COLORS = [
  '#6366F1', // indigo
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#A855F7', // purple
  '#64748B', // slate
]

function getClusterColor(clusterId: number | undefined): string {
  if (clusterId === undefined) return '#64748B'
  return CLUSTER_COLORS[(clusterId - 1) % CLUSTER_COLORS.length]
}

interface ScatterClusterInfo {
  clusterId: number
  name: string
  termCount: number
  terms: string[]
  avgScore: number
  avgCTR: number
  totalImpressions: number
}

export function RadarScatterChart({ data, highlightTerm, onHighlightTermChange }: ScatterChartProps) {
  const [colorBy, setColorBy] = useState<'cluster' | 'score'>('cluster')
  const [selectedClusterId, setSelectedClusterId] = useState<'all' | number>('all')
  const [topClusterLimit, setTopClusterLimit] = useState<3 | 5 | 8 | 12 | 'all'>(5)

  const sampledTerms = useMemo(() => {
    const rankedByImpact = [...data].sort(
      (a, b) => b.impressions - a.impressions || b.clicks - a.clicks
    )
    const sampled = rankedByImpact.slice(0, Math.min(MAX_SCATTER_TERMS, rankedByImpact.length))

    if (highlightTerm) {
      const highlighted = data.find((term) => term.term === highlightTerm)

      if (highlighted && !sampled.some((term) => term.term === highlightTerm)) {
        sampled.push(highlighted)
      }
    }

    return sampled
  }, [data, highlightTerm])

  const clusterStats = useMemo(() => {
    const stats = new Map<number, ScatterClusterInfo>()

    sampledTerms.forEach(term => {
      if (term.clusterId === undefined) return

      if (!stats.has(term.clusterId)) {
        stats.set(term.clusterId, {
          clusterId: term.clusterId,
          name: term.term,
          termCount: 0,
          terms: [],
          avgScore: 0,
          avgCTR: 0,
          totalImpressions: 0
        })
      }

      const cluster = stats.get(term.clusterId)!
      cluster.termCount++
      cluster.terms.push(term.term)
      cluster.totalImpressions += term.impressions
      cluster.avgScore += term.score
      cluster.avgCTR += term.ctr
      if (term.impressions > (data.find(t => t.term === cluster.name)?.impressions ?? 0)) {
        cluster.name = term.term
      }
    })

    stats.forEach(cluster => {
      cluster.avgScore /= cluster.termCount
      cluster.avgCTR /= cluster.termCount
    })

    return stats
  }, [sampledTerms, data])

  const uniqueClusters = useMemo(() => {
    return Array.from(clusterStats.keys()).sort((a, b) => {
      const aImpressions = clusterStats.get(a)?.totalImpressions ?? 0
      const bImpressions = clusterStats.get(b)?.totalImpressions ?? 0
      return bImpressions - aImpressions
    })
  }, [clusterStats])

  const highlightedTermData = useMemo(() => {
    if (!highlightTerm) return null
    return sampledTerms.find(t => t.term === highlightTerm)
  }, [sampledTerms, highlightTerm])

  const visibleClusterIds = useMemo(() => {
    if (topClusterLimit === 'all') {
      return uniqueClusters
    }
    return uniqueClusters.slice(0, topClusterLimit)
  }, [topClusterLimit, uniqueClusters])

  const visibleTerms = useMemo(() => {
    if (colorBy !== 'cluster') {
      return sampledTerms
    }

    if (selectedClusterId === 'all') {
      if (topClusterLimit === 'all') {
        return sampledTerms
      }
      return sampledTerms.filter((term) => term.clusterId !== undefined && visibleClusterIds.includes(term.clusterId))
    }

    return sampledTerms.filter((term) => term.clusterId === selectedClusterId)
  }, [colorBy, sampledTerms, selectedClusterId, topClusterLimit, visibleClusterIds])

  const chartData = useMemo(
    () =>
      visibleTerms.map((term) => ({
        x: term.ctr,
        y: term.position,
        z: term.impressions,
        term: term.term,
        score: term.score,
        clicks: term.clicks,
        impressions: term.impressions,
        action: term.action.label,
        actionType: term.action.type,
        clusterId: term.clusterId,
        color: colorBy === 'cluster' ? getClusterColor(term.clusterId) : getScoreColor(term.score, undefined, term.position),
      })),
    [visibleTerms, colorBy]
  )

  const avgCTR = data.reduce((sum, d) => sum + d.ctr, 0) / data.length
  const avgPosition = data.reduce((sum, d) => sum + d.position, 0) / data.length
  const totalImpressions = data.reduce((sum, d) => sum + d.impressions, 0)
  const sampledImpressions = visibleTerms.reduce((sum, d) => sum + d.impressions, 0)
  const impressionCoverage = totalImpressions > 0 ? sampledImpressions / totalImpressions : 1

  const ACTION_COLORS = {
    avoid: '#10B981',
    evaluate: '#6366F1',
    test: '#F59E0B',
    invest: '#EF4444',
  }

  return (
    <Card className="gap-0 overflow-hidden border-border/60 py-0 bg-gradient-to-br from-card via-card to-muted/20 dark:border-border/30 dark:to-muted/10">
      <CardHeader className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-muted/45 via-muted/24 to-background px-5 py-4 dark:border-border/30 dark:from-muted/28 dark:via-muted/16">
        <div className="absolute inset-0 opacity-40" aria-hidden="true">
          <div className="absolute right-0 top-0 h-28 w-56 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_62%)]" />
        </div>
        <div className="relative flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 xl:flex xl:items-center xl:gap-4">
            <CardTitle className="text-sm font-medium whitespace-nowrap">
              Matriz CTR vs Posicao
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs xl:mt-0 xl:whitespace-nowrap">
              {visibleTerms.length} termos em foco | {(impressionCoverage * 100).toFixed(0)}% das impressoes | Tamanho = volume de impressoes
            </CardDescription>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2.5 xl:max-w-[56%]">
            <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/92 px-2 py-1.5 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.18)] dark:border-border/50 dark:bg-background/60 dark:shadow-none">
              <button
                onClick={() => setColorBy('score')}
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] transition-[background-color,color,box-shadow] ${
                  colorBy === 'score'
                    ? 'bg-background text-foreground shadow-[0_8px_20px_-16px_rgba(15,23,42,0.24)] dark:shadow-none'
                    : 'text-foreground/68 hover:bg-black/[0.035] hover:text-foreground dark:text-muted-foreground dark:hover:bg-white/[0.04] dark:hover:text-foreground'
                }`}
              >
                Score
              </button>
              <button
                onClick={() => setColorBy('cluster')}
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] transition-[background-color,color,box-shadow] ${
                  colorBy === 'cluster'
                    ? 'bg-background text-foreground shadow-[0_8px_20px_-16px_rgba(15,23,42,0.24)] dark:shadow-none'
                    : 'text-foreground/68 hover:bg-black/[0.035] hover:text-foreground dark:text-muted-foreground dark:hover:bg-white/[0.04] dark:hover:text-foreground'
                }`}
              >
                Cluster
              </button>
            </div>
            <div className="flex min-w-[92px] flex-col items-center justify-center rounded-[22px] border border-border/70 bg-card/92 px-3 py-1.5 text-center shadow-[0_12px_28px_-20px_rgba(15,23,42,0.16)] dark:border-border/50 dark:bg-background/60 dark:shadow-none">
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Total</span>
              <span className="mt-0.5 text-[11px] font-semibold tracking-[0.18em] text-foreground">{data.length}</span>
            </div>
            {colorBy === 'score' ? (
              <div className="flex items-center gap-3">
                {(['avoid', 'evaluate', 'test', 'invest'] as const).map((action) => (
                  <div key={action} className="flex items-center gap-1.5">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: ACTION_COLORS[action] }}
                    />
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {action === 'avoid' ? 'Evitar' : action === 'evaluate' ? 'Avaliar' : action === 'test' ? 'Testar' : 'Investir'}
                    </span>
                  </div>
                ))}
              </div>
            ) : highlightedTermData?.clusterId !== undefined ? (
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1">
                <button
                  type="button"
                  onClick={() => onHighlightTermChange?.(null)}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30"
                  title="Ver todos"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
                <div 
                  className="h-2 w-2 rounded-full" 
                  style={{ backgroundColor: getClusterColor(highlightedTermData.clusterId) }}
                />
                <span className="text-[10px] font-medium text-primary">
                  {clusterStats.get(highlightedTermData.clusterId)?.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({clusterStats.get(highlightedTermData.clusterId)?.termCount ?? 0})
                </span>
              </div>
            ) : (
              <>
                <ClusterSelector
                  clusterStats={clusterStats}
                  visibleClusterIds={visibleClusterIds}
                  selectedClusterId={selectedClusterId}
                  onSelect={(clusterId) => setSelectedClusterId(clusterId)}
                />
                <TopLimitSelector
                  value={topClusterLimit}
                  onSelect={(value) => {
                    setTopClusterLimit(value)
                    setSelectedClusterId('all')
                  }}
                />
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 30, right: 30, bottom: 50, left: 50 }}>
              {/* Reference lines for averages */}
              <ReferenceLine
                x={avgCTR}
                stroke="currentColor"
                strokeDasharray="4 4"
                strokeOpacity={0.2}
              />
              <ReferenceLine
                y={avgPosition}
                stroke="currentColor"
                strokeDasharray="4 4"
                strokeOpacity={0.2}
              />
              
              <XAxis
                type="number"
                dataKey="x"
                name="CTR"
                unit="%"
                domain={[0, 'auto']}
                tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                axisLine={{ stroke: 'currentColor', strokeOpacity: 0.1 }}
                tickLine={false}
                label={{
                  value: 'CTR Organico (%)',
                  position: 'bottom',
                  offset: 30,
                  style: { fontSize: 11, fill: 'currentColor', opacity: 0.6 }
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Posicao"
                domain={[0, 'auto']}
                reversed
                tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                axisLine={{ stroke: 'currentColor', strokeOpacity: 0.1 }}
                tickLine={false}
                label={{
                  value: 'Posicao',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -10,
                  style: { fontSize: 11, fill: 'currentColor', opacity: 0.6 }
                }}
              />
              <ZAxis type="number" dataKey="z" range={[36, 220]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3', strokeOpacity: 0.3 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload
                    const clusterName = d.clusterId !== undefined ? clusterStats.get(d.clusterId)?.name : null
                    return (
                      <div className="rounded-lg border border-border/60 bg-card px-3 py-2.5 shadow-xl">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="text-sm font-medium">{d.term}</span>
                          {clusterName && (
                            <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                              {clusterName}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div className="text-muted-foreground">Score</div>
                          <div className="font-mono font-medium">{d.score.toFixed(3)}</div>
                          <div className="text-muted-foreground">Acao</div>
                          <div className="font-medium">{d.action}</div>
                          <div className="text-muted-foreground">Posicao</div>
                          <div className="font-mono">{d.y.toFixed(1)}</div>
                          <div className="text-muted-foreground">CTR</div>
                          <div className="font-mono">{d.x.toFixed(2)}%</div>
                          <div className="text-muted-foreground">Cliques</div>
                          <div className="font-mono">{formatNumber(d.clicks)}</div>
                          <div className="text-muted-foreground">Impressoes</div>
                          <div className="font-mono">{formatNumber(d.impressions)}</div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter name="Termos" data={chartData}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    fillOpacity={highlightTerm && entry.term !== highlightTerm ? 0.12 : 0.42}
                    stroke={highlightTerm === entry.term ? 'currentColor' : entry.color}
                    strokeWidth={highlightTerm === entry.term ? 2 : 1}
                    strokeOpacity={highlightTerm === entry.term ? 1 : 0.22}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>

    </Card>
  )
}

function ClusterSelector({
  clusterStats,
  visibleClusterIds,
  selectedClusterId,
  onSelect,
}: {
  clusterStats: Map<number, ScatterClusterInfo>
  visibleClusterIds: number[]
  selectedClusterId: 'all' | number
  onSelect: (clusterId: 'all' | number) => void
}) {
  const clusters = visibleClusterIds
    .map((clusterId) => clusterStats.get(clusterId))
    .filter((cluster): cluster is ScatterClusterInfo => Boolean(cluster))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/92 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground shadow-[0_12px_28px_-20px_rgba(15,23,42,0.16)] transition-colors hover:border-primary/20 hover:text-primary dark:border-border/50 dark:bg-background/60 dark:shadow-none"
        >
          <span className="text-muted-foreground">Cluster</span>
          <span className="max-w-[120px] truncate normal-case tracking-normal text-foreground">
            {selectedClusterId === 'all'
              ? 'Todos'
              : clusterStats.get(selectedClusterId)?.name ?? 'Todos'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[280px] rounded-2xl border-border/50 bg-popover/95 p-2 shadow-2xl backdrop-blur-xl">
        <div className="px-3 pb-2 pt-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Cluster visivel</p>
          <p className="mt-1 text-sm font-medium tracking-tight text-foreground">Escolha um cluster ou veja todos</p>
        </div>
        <div className="space-y-1">
          <ClusterOption
            label="Todos os clusters"
            selected={selectedClusterId === 'all'}
            onClick={() => onSelect('all')}
          />
          {clusters.map((cluster) => (
            <ClusterOption
              key={cluster.clusterId}
              label={cluster.name}
              meta={`${cluster.termCount} termos`}
              dotColor={getClusterColor(cluster.clusterId)}
              selected={selectedClusterId === cluster.clusterId}
              onClick={() => onSelect(cluster.clusterId)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TopLimitSelector({
  value,
  onSelect,
}: {
  value: 3 | 5 | 8 | 12 | 'all'
  onSelect: (value: 3 | 5 | 8 | 12 | 'all') => void
}) {
  const options: Array<3 | 5 | 8 | 12 | 'all'> = [3, 5, 8, 12, 'all']

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/92 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground shadow-[0_12px_28px_-20px_rgba(15,23,42,0.16)] transition-colors hover:border-primary/20 hover:text-primary dark:border-border/50 dark:bg-background/60 dark:shadow-none"
        >
          <span className="text-muted-foreground">Top</span>
          <span className="text-foreground">{value === 'all' ? 'Todos' : value}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[180px] rounded-2xl border-border/50 bg-popover/95 p-2 shadow-2xl backdrop-blur-xl">
        <div className="px-3 pb-2 pt-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Top clusters</p>
        </div>
        <div className="space-y-1">
          {options.map((option) => (
            <ClusterOption
              key={option}
              label={option === 'all' ? 'Todos' : `Top ${option}`}
              selected={value === option}
              onClick={() => onSelect(option)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ClusterOption({
  label,
  meta,
  dotColor,
  selected,
  onClick,
}: {
  label: string
  meta?: string
  dotColor?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-[background-color,color,border-color] ${
        selected ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      }`}
    >
      <div className="min-w-0 flex items-center gap-2">
        {dotColor && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />}
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{label}</div>
          {meta && <div className="mt-0.5 text-[11px] text-muted-foreground">{meta}</div>}
        </div>
      </div>
      <div className="ml-3 flex h-5 w-5 items-center justify-center rounded-full border border-border/50 bg-background/80">
        {selected ? <Check className="h-3 w-3 text-primary" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />}
      </div>
    </button>
  )
}
