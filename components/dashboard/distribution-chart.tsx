'use client'

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { EnrichedTermData } from '@/lib/radar-data'
import { getScoreColor } from '@/lib/radar-data'

interface DistributionChartProps {
  data: EnrichedTermData[]
}

const SCORE_COLORS = {
  avoid: '#10B981',
  evaluate: '#6366F1',
  test: '#F59E0B',
  invest: '#EF4444',
}

export function ScoreDistributionChart({ data }: DistributionChartProps) {
  const buckets = [
    { range: '0.0', min: 0, max: 0.1, label: 'Evitar', count: 0 },
    { range: '0.1', min: 0.1, max: 0.2, label: 'Avaliar', count: 0 },
    { range: '0.2', min: 0.2, max: 0.3, label: 'Avaliar', count: 0 },
    { range: '0.3', min: 0.3, max: 0.4, label: 'Testar', count: 0 },
    { range: '0.4', min: 0.4, max: 0.5, label: 'Testar', count: 0 },
    { range: '0.5', min: 0.5, max: 0.6, label: 'Testar', count: 0 },
    { range: '0.6', min: 0.6, max: 0.7, label: 'Investir', count: 0 },
    { range: '0.7', min: 0.7, max: 0.8, label: 'Investir', count: 0 },
    { range: '0.8', min: 0.8, max: 0.9, label: 'Investir', count: 0 },
    { range: '0.9', min: 0.9, max: 1.0, label: 'Investir', count: 0 },
  ]

  data.forEach((d) => {
    const bucket = buckets.find((b) => d.score >= b.min && d.score < b.max)
    if (bucket) bucket.count++
  })

  const chartData = buckets.map((b) => ({
    range: b.range,
    count: b.count,
    score: (b.min + b.max) / 2,
    label: b.label,
  }))

  return (
    <Card className="gap-0 overflow-hidden border-border/60 py-0 bg-gradient-to-br from-card via-card to-muted/20 dark:border-border/30 dark:to-muted/10">
      <CardHeader className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-muted/45 via-muted/24 to-background px-5 py-4 dark:border-border/30 dark:from-muted/28 dark:via-muted/16">
        <div className="absolute inset-0 opacity-40" aria-hidden="true">
          <div className="absolute right-0 top-0 h-24 w-44 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_62%)]" />
        </div>
        <div className="relative">
          <CardTitle className="text-sm font-medium">
            Distribuicao de Scores
          </CardTitle>
          <CardDescription className="text-xs">
            Histograma por faixa de score RADAR
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={SCORE_COLORS.avoid} stopOpacity={0.8} />
                  <stop offset="30%" stopColor={SCORE_COLORS.evaluate} stopOpacity={0.8} />
                  <stop offset="60%" stopColor={SCORE_COLORS.test} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={SCORE_COLORS.invest} stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="range"
                tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload
                    return (
                      <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-xl">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: getScoreColor(d.score) }}
                          />
                          <span className="text-xs font-medium">Score {d.range}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {d.count} termos | {d.label}
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="url(#colorGradient)"
                strokeWidth={2}
                fill="url(#colorGradient)"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface TopTermsChartProps {
  data: EnrichedTermData[]
  title?: string
  limit?: number
}

export function TopTermsChart({ data, title = 'Top Oportunidades RADAR', limit = 8 }: TopTermsChartProps) {
  const getOpportunityIndex = (term: EnrichedTermData) =>
    term.score * Math.log10(term.impressions + 10)

  const topData = [...data]
    .sort((a, b) => getOpportunityIndex(b) - getOpportunityIndex(a))
    .slice(0, limit)
    .map((d) => ({
      term: d.term.length > 18 ? d.term.slice(0, 16) + '…' : d.term,
      fullTerm: d.term,
      score: d.score,
      clicks: d.clicks,
      impressions: d.impressions,
      opportunity: getOpportunityIndex(d),
      color: getScoreColor(d.score),
    }))

  const chartHeight = Math.max(184, topData.length * 34)

  return (
    <Card className="gap-0 overflow-hidden border-border/60 py-0 bg-gradient-to-br from-card via-card to-muted/20 dark:border-border/30 dark:to-muted/10">
      <CardHeader className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-muted/45 via-muted/24 to-background px-5 py-4 dark:border-border/30 dark:from-muted/28 dark:via-muted/16">
        <div className="absolute inset-0 opacity-40" aria-hidden="true">
          <div className="absolute right-0 top-0 h-24 w-44 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_62%)]" />
        </div>
        <div className="relative">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          <CardDescription className="text-xs">
            Melhor equilibrio entre score RADAR e volume de impressao
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topData}
              layout="vertical"
              margin={{ top: 0, right: -10, bottom: 0, left: -8 }}
              barSize={13}
            >
              <XAxis
                type="number"
                domain={[0, 1]}
                tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="term"
                tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.8 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                width={100}
              />
              <Tooltip
                cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload
                    return (
                      <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-xl">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="text-xs font-medium">{d.fullTerm}</span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-2 gap-x-3 text-xs">
                          <span className="text-muted-foreground">Score</span>
                          <span className="font-mono font-medium">{d.score.toFixed(3)}</span>
                          <span className="text-muted-foreground">Cliques</span>
                          <span className="font-mono">{d.clicks.toLocaleString()}</span>
                          <span className="text-muted-foreground">Impressoes</span>
                          <span className="font-mono">{d.impressions.toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {topData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
