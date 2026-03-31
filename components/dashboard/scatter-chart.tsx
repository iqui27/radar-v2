'use client'

import { useMemo } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { EnrichedTermData } from '@/lib/radar-data'
import { formatNumber, getScoreColor } from '@/lib/radar-data'

interface ScatterChartProps {
  data: EnrichedTermData[]
  highlightTerm?: string
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

interface ClusterInfo {
  clusterId: number
  termCount: number
  topTerm: string
  avgScore: number
  avgCTR: number
  totalImpressions: number
}

export function RadarScatterChart({ data, highlightTerm }: ScatterChartProps) {
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
    const stats = new Map<number, ClusterInfo>()
    const unclustered: ClusterInfo = {
      clusterId: 0,
      termCount: 0,
      topTerm: '-',
      avgScore: 0,
      avgCTR: 0,
      totalImpressions: 0
    }

    sampledTerms.forEach(term => {
      if (term.clusterId === undefined) {
        unclustered.termCount++
        unclustered.totalImpressions += term.impressions
        return
      }

      if (!stats.has(term.clusterId)) {
        stats.set(term.clusterId, {
          clusterId: term.clusterId,
          termCount: 0,
          topTerm: term.term,
          avgScore: 0,
          avgCTR: 0,
          totalImpressions: 0
        })
      }

      const cluster = stats.get(term.clusterId)!
      cluster.termCount++
      cluster.totalImpressions += term.impressions
      cluster.avgScore += term.score
      cluster.avgCTR += term.ctr
      if (term.impressions > (data.find(t => t.term === cluster.topTerm)?.impressions ?? 0)) {
        cluster.topTerm = term.term
      }
    })

    stats.forEach(cluster => {
      cluster.avgScore /= cluster.termCount
      cluster.avgCTR /= cluster.termCount
    })

    return { stats, unclustered }
  }, [sampledTerms, data])

  const uniqueClusters = useMemo(() => {
    return Array.from(clusterStats.stats.keys()).sort((a, b) => a - b)
  }, [clusterStats])

  const highlightedTermData = useMemo(() => {
    if (!highlightTerm) return null
    return sampledTerms.find(t => t.term === highlightTerm)
  }, [sampledTerms, highlightTerm])

  const chartData = useMemo(
    () =>
      sampledTerms.map((term) => ({
        x: term.ctr,
        y: term.position,
        z: term.impressions,
        term: term.term,
        score: term.score,
        clicks: term.clicks,
        impressions: term.impressions,
        action: term.action.label,
        clusterId: term.clusterId,
        color: getClusterColor(term.clusterId),
      })),
    [sampledTerms]
  )

  const avgCTR = data.reduce((sum, d) => sum + d.ctr, 0) / data.length
  const avgPosition = data.reduce((sum, d) => sum + d.position, 0) / data.length
  const totalImpressions = data.reduce((sum, d) => sum + d.impressions, 0)
  const sampledImpressions = sampledTerms.reduce((sum, d) => sum + d.impressions, 0)
  const impressionCoverage = totalImpressions > 0 ? sampledImpressions / totalImpressions : 1

  return (
    <Card className="gap-0 overflow-hidden border-border/60 py-0 bg-gradient-to-br from-card via-card to-muted/20 dark:border-border/30 dark:to-muted/10">
      <CardHeader className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-muted/45 via-muted/24 to-background px-5 py-4 dark:border-border/30 dark:from-muted/28 dark:via-muted/16">
        <div className="absolute inset-0 opacity-40" aria-hidden="true">
          <div className="absolute right-0 top-0 h-28 w-56 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_62%)]" />
        </div>
        <div className="relative flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              Matriz CTR vs Posicao
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {sampledTerms.length} termos em foco | {(impressionCoverage * 100).toFixed(0)}% das impressoes | Tamanho = volume de impressoes
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground dark:border-border/50 dark:bg-background/60">
              Universo total {data.length}
            </div>
            {highlightedTermData?.clusterId !== undefined ? (
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1">
                <div 
                  className="h-2 w-2 rounded-full" 
                  style={{ backgroundColor: getClusterColor(highlightedTermData.clusterId) }}
                />
                <span className="text-[10px] font-medium text-primary">
                  Cluster {highlightedTermData.clusterId}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({clusterStats.stats.get(highlightedTermData.clusterId)?.termCount ?? 0} termos)
                </span>
                <span className="text-[10px] text-muted-foreground/70">
                  · Top: {clusterStats.stats.get(highlightedTermData.clusterId)?.topTerm}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600" />
                  <span className="text-[10px] text-muted-foreground">
                    All ({uniqueClusters.length} clusters)
                  </span>
                </div>
                {uniqueClusters.slice(0, 5).map((clusterId) => {
                  const stat = clusterStats.stats.get(clusterId)
                  return (
                    <div key={clusterId} className="group relative flex items-center gap-1.5">
                      <div 
                        className="h-2 w-2 rounded-full cursor-pointer" 
                        style={{ backgroundColor: getClusterColor(clusterId) }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        C{clusterId} ({stat?.termCount ?? 0})
                      </span>
                      <div className="absolute bottom-full left-1/2 z-50 mb-2 hidden w-max -translate-x-1/2 flex-col gap-1 rounded-lg border border-border/80 bg-card px-3 py-2 shadow-xl group-hover:flex">
                        <p className="text-[10px] font-semibold text-foreground">Cluster {clusterId}</p>
                        <p className="text-[10px] text-muted-foreground">Termos: {stat?.termCount}</p>
                        <p className="text-[10px] text-muted-foreground">Top: {stat?.topTerm}</p>
                        <p className="text-[10px] text-muted-foreground">Score médio: {stat?.avgScore.toFixed(3)}</p>
                        <p className="text-[10px] text-muted-foreground">CTR médio: {stat?.avgCTR.toFixed(2)}%</p>
                      </div>
                    </div>
                  )
                })}
                {uniqueClusters.length > 5 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{uniqueClusters.length - 5}
                  </span>
                )}
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
                    return (
                      <div className="rounded-lg border border-border/60 bg-card px-3 py-2.5 shadow-xl">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="text-sm font-medium">{d.term}</span>
                          {d.clusterId !== undefined && (
                            <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                              Cluster {d.clusterId}
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
