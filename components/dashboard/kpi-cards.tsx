'use client'

import { formatNumber, SCORE_ACTION_COLORS, SCORE_GRADIENT } from '@/lib/radar-data'
import { TrendingUp, MousePointerClick, Eye, Target, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface KPICardsProps {
  totalTerms: number
  totalClicks: number
  totalImpressions: number
  avgPosition: number
  avgCTR: number
  scoreDistribution: {
    avoid: number
    evaluate: number
    test: number
    invest: number
  }
}

export function KPICards({
  totalTerms,
  totalClicks,
  totalImpressions,
  avgPosition,
  avgCTR,
}: KPICardsProps) {
  const kpis = [
    { 
      label: 'Termos Analisados', 
      value: totalTerms.toString(),
      icon: TrendingUp,
      trend: null,
    },
    { 
      label: 'Total de Cliques', 
      value: formatNumber(totalClicks),
      icon: MousePointerClick,
      trend: { value: 12.5, positive: true },
    },
    { 
      label: 'Impressoes', 
      value: formatNumber(totalImpressions),
      icon: Eye,
      trend: { value: 8.2, positive: true },
    },
    { 
      label: 'Posicao Media', 
      value: avgPosition.toFixed(1),
      icon: Target,
      trend: { value: 2.1, positive: true },
    },
    { 
      label: 'CTR Medio', 
      value: `${avgCTR.toFixed(2)}%`,
      icon: Percent,
      trend: { value: 0.3, positive: false },
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <div
            key={kpi.label}
            className={`group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.12)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-border hover:shadow-[0_20px_44px_-30px_rgba(15,23,42,0.16)] dark:shadow-none ${
              index === 0 ? 'col-span-2 md:col-span-1' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70 dark:bg-muted/50">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {kpi.trend && (
                <div className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  kpi.trend.positive 
                    ? 'bg-chart-1/10 text-chart-1' 
                    : 'bg-chart-4/10 text-chart-4'
                }`}>
                  {kpi.trend.positive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {kpi.trend.value}%
                </div>
              )}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold tracking-tight">
                {kpi.value}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {kpi.label}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ScoreDistribution({ distribution }: { distribution: KPICardsProps['scoreDistribution'] }) {
  const total = distribution.avoid + distribution.evaluate + distribution.test + distribution.invest
  
  const items = [
    { label: 'Evitar', value: distribution.avoid, color: SCORE_ACTION_COLORS.avoid },
    { label: 'Avaliar', value: distribution.evaluate, color: SCORE_ACTION_COLORS.evaluate },
    { label: 'Testar', value: distribution.test, color: SCORE_ACTION_COLORS.test },
    { label: 'Investir', value: distribution.invest, color: SCORE_ACTION_COLORS.invest },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" style={{ backgroundImage: SCORE_GRADIENT }}>
        {items.map((item) => (
          <div
            key={item.label}
            className="transition-[width] duration-500"
            style={{
              width: `${(item.value / total) * 100}%`,
              backgroundColor: item.color,
            }}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] text-muted-foreground">
              {item.label}
            </span>
            <span className="font-mono text-[11px] font-medium">
              {item.value}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({((item.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
