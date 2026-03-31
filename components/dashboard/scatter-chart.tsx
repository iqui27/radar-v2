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
import { X, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  const [showAllClustersModal, setShowAllClustersModal] = useState(false)

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
        actionType: term.action.type,
        clusterId: term.clusterId,
        color: colorBy === 'cluster' ? getClusterColor(term.clusterId) : getScoreColor(term.score),
      })),
    [sampledTerms, colorBy]
  )

  const avgCTR = data.reduce((sum, d) => sum + d.ctr, 0) / data.length
  const avgPosition = data.reduce((sum, d) => sum + d.position, 0) / data.length
  const totalImpressions = data.reduce((sum, d) => sum + d.impressions, 0)
  const sampledImpressions = sampledTerms.reduce((sum, d) => sum + d.impressions, 0)
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
        <div className="relative flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              Matriz CTR vs Posicao
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {sampledTerms.length} termos em foco | {(impressionCoverage * 100).toFixed(0)}% das impressoes | Tamanho = volume de impressoes
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-2.5 py-1 dark:border-border/50 dark:bg-background/60">
              <button
                onClick={() => setColorBy('score')}
                className={`text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ${colorBy === 'score' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'}`}
              >
                Score
              </button>
              <div className="h-3 w-px bg-border/50" />
              <button
                onClick={() => setColorBy('cluster')}
                className={`text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ${colorBy === 'cluster' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'}`}
              >
                Cluster
              </button>
            </div>
            <div className="rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground dark:border-border/50 dark:bg-background/60">
              Total {data.length}
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
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600" />
                  <span className="text-[10px] text-muted-foreground">
                    All ({uniqueClusters.length})
                  </span>
                </div>
                {uniqueClusters.slice(0, 5).map((clusterId) => {
                  const stat = clusterStats.get(clusterId)
                  return (
                    <ClusterHoverModal key={clusterId} clusterId={clusterId} stat={stat} />
                  )
                })}
                {uniqueClusters.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllClustersModal(true)}
                    className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20"
                  >
                    +{uniqueClusters.length - 5}
                  </button>
                )}
                {showAllClustersModal && (
                  <AllClustersModal
                    clusters={Array.from(clusterStats.values()).sort((a, b) => b.totalImpressions - a.totalImpressions)}
                    onClose={() => setShowAllClustersModal(false)}
                  />
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

function ClusterHoverModal({ clusterId, stat }: { clusterId: number; stat: ScatterClusterInfo | undefined }) {
  const [show, setShow] = useState(false)
  
  if (!stat) return null
  
  return (
    <div 
      className="group relative flex items-center gap-1.5"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div 
        className="h-2 w-2 rounded-full cursor-pointer" 
        style={{ backgroundColor: getClusterColor(clusterId) }}
      />
      <span className="text-[10px] text-muted-foreground">
        {stat.name.slice(0, 12)} ({stat.termCount})
      </span>
      {show && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border/80 bg-card px-3 py-2 shadow-xl">
          <p className="mb-2 border-b border-border/50 pb-2 text-[10px] font-semibold text-foreground">
            {stat.name}
          </p>
          <p className="mb-2 text-[10px] text-muted-foreground">
            Score médio: <span className="font-mono font-medium text-foreground">{stat.avgScore.toFixed(3)}</span> · CTR médio: <span className="font-mono font-medium text-foreground">{stat.avgCTR.toFixed(2)}%</span>
          </p>
          <div className="max-h-32 overflow-y-auto">
            <p className="mb-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Termos:</p>
            <div className="flex flex-wrap gap-1">
              {stat.terms.slice(0, 20).map((term) => (
                <span key={term} className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {term}
                </span>
              ))}
              {stat.terms.length > 20 && (
                <span className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  +{stat.terms.length - 20} mais
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AllClustersModal({ 
  clusters, 
  onClose 
}: { 
  clusters: ScatterClusterInfo[]
  onClose: () => void 
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Todos os Clusters</h2>
            <p className="text-sm text-muted-foreground">{clusters.length} clusters encontrados</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {clusters.map((cluster) => (
              <div 
                key={cluster.clusterId}
                className="rounded-xl border border-border/40 bg-muted/20 p-4 dark:border-white/6 dark:bg-background/20"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: getClusterColor(cluster.clusterId) }}
                  />
                  <span className="font-medium text-foreground">{cluster.name}</span>
                </div>
                <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded bg-background/50 px-2 py-1.5 text-center">
                    <p className="text-muted-foreground">Termos</p>
                    <p className="font-mono font-semibold text-foreground">{cluster.termCount}</p>
                  </div>
                  <div className="rounded bg-background/50 px-2 py-1.5 text-center">
                    <p className="text-muted-foreground">Score</p>
                    <p className="font-mono font-semibold text-foreground">{cluster.avgScore.toFixed(2)}</p>
                  </div>
                  <div className="rounded bg-background/50 px-2 py-1.5 text-center">
                    <p className="text-muted-foreground">CTR</p>
                    <p className="font-mono font-semibold text-foreground">{cluster.avgCTR.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="mb-2 text-[10px] text-muted-foreground">
                  Impressões: <span className="font-mono font-medium text-foreground">{formatNumber(cluster.totalImpressions)}</span>
                </div>
                <div className="max-h-24 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {cluster.terms.slice(0, 15).map((term) => (
                      <span key={term} className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {term}
                      </span>
                    ))}
                    {cluster.terms.length > 15 && (
                      <span className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        +{cluster.terms.length - 15}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
