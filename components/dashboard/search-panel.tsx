'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Eye,
  Filter,
  MousePointerClick,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TermCluster } from './term-cluster'
import type { EnrichedTermData } from '@/lib/radar-data'
import type { SearchHistoryListItem, TermMetricBaseline } from '@/lib/radar-history'
import { calculateClusterMetrics, formatNumber, getClusterTerms, getRelatedClusters, getScoreColor, getScoreLabel } from '@/lib/radar-data'

interface BrandFilter {
  includeBB: boolean
  excludeBB: boolean
}

interface SearchPanelProps {
  data: EnrichedTermData[]
  historyEntries: SearchHistoryListItem[]
  onHistorySelect: (entryId: string) => void
  onTermSelect: (term: EnrichedTermData, query?: string) => void
  selectedTerm: EnrichedTermData | null
  selectedTermBaseline: TermMetricBaseline | null
}

export function SearchPanel({
  data,
  historyEntries,
  onHistorySelect,
  onTermSelect,
  selectedTerm,
  selectedTermBaseline,
}: SearchPanelProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [metricsView, setMetricsView] = useState<'aggregate' | 'individual'>('aggregate')
  const [brandFilter, setBrandFilter] = useState<BrandFilter>({ includeBB: false, excludeBB: false })
  const [isBrandFilterOpen, setIsBrandFilterOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const brandFilterRef = useRef<HTMLDivElement>(null)

  // Filter data based on brand filter
  const filteredData = useMemo(() => {
    return data.filter(term => {
      const lowerTerm = term.term.toLowerCase()
      const hasBB = lowerTerm.includes('bb ') || lowerTerm.startsWith('bb ')
      
      if (brandFilter.includeBB && !hasBB) return false
      if (brandFilter.excludeBB && hasBB) return false
      
      return true
    })
  }, [data, brandFilter])

  const suggestions = useMemo(() => {
    if (!search) return []
    const query = search.toLowerCase()
    return filteredData
      .filter(d => d.term.toLowerCase().includes(query))
      .slice(0, 8)
  }, [filteredData, search])

  // Close brand filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (brandFilterRef.current && !brandFilterRef.current.contains(e.target as Node)) {
        setIsBrandFilterOpen(false)
      }
    }
    if (isBrandFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isBrandFilterOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (term: EnrichedTermData) => {
    const currentQuery = search.trim()
    setSearch('')
    setIsOpen(false)
    onTermSelect(term, currentQuery || term.term)
  }

  return (
    <div className="space-y-6">
      <div className={`gap-4 ${selectedTerm ? 'flex flex-col lg:flex-row lg:items-end lg:justify-between' : ''}`}>
        {/* Search Bar */}
        <div ref={containerRef} className="relative min-w-0 w-full lg:w-[820px] lg:max-w-[820px] lg:flex-none">
          <div className="relative">
            <label htmlFor="term-search" className="sr-only">
              Buscar termo
            </label>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="term-search"
              ref={inputRef}
              type="text"
              name="term-search"
              aria-label="Buscar termo"
              autoComplete="off"
              placeholder="Digite um termo de busca…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              className="h-11 border-border/50 bg-card pl-11 text-sm transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          {isOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border/50 bg-card shadow-xl">
              {suggestions.map((term, index) => (
                <button
                  type="button"
                  key={term.term}
                  className={`group flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    index !== suggestions.length - 1 ? 'border-b border-border/30' : ''
                  }`}
                  onClick={() => handleSelect(term)}
                >
                  <span className="text-sm font-medium group-hover:text-primary">{term.term}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: getScoreColor(term.score, undefined, term.position) }}
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {term.score.toFixed(2)}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-[11px] text-muted-foreground">
              {filteredData.length} termos disponiveis para consulta
              {filteredData.length !== data.length && (
                <span className="ml-1 text-muted-foreground/60">
                  (de {data.length})
                </span>
              )}
            </p>

            {/* Brand Filter Dropdown */}
            <div ref={brandFilterRef} className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBrandFilterOpen(!isBrandFilterOpen)}
                className="h-7 gap-1.5 rounded-full border-border/50 bg-card px-3 text-[11px] text-foreground/75 hover:border-primary/25 hover:text-foreground dark:bg-card/55"
              >
                <Filter className="h-3 w-3" />
                <span>Filtrar marca</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isBrandFilterOpen ? 'rotate-180' : ''}`} />
              </Button>

              {isBrandFilterOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-border/50 bg-card shadow-xl">
                  <div className="p-3">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Filtrar por marca
                    </p>
                    <div className="space-y-2">
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={brandFilter.includeBB}
                          onChange={(e) => setBrandFilter(prev => ({ 
                            ...prev, 
                            includeBB: e.target.checked,
                            excludeBB: e.target.checked ? false : prev.excludeBB 
                          }))}
                          className="h-3.5 w-3.5 rounded border-border/50 text-primary focus:ring-primary/50"
                        />
                        <span className="text-sm">Apenas termos com "BB"</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={brandFilter.excludeBB}
                          onChange={(e) => setBrandFilter(prev => ({ 
                            ...prev, 
                            excludeBB: e.target.checked,
                            includeBB: e.target.checked ? false : prev.includeBB 
                          }))}
                          className="h-3.5 w-3.5 rounded border-border/50 text-primary focus:ring-primary/50"
                        />
                        <span className="text-sm">Remover termos com "BB"</span>
                      </label>
                    </div>
                    {(brandFilter.includeBB || brandFilter.excludeBB) && (
                      <button
                        type="button"
                        onClick={() => setBrandFilter({ includeBB: false, excludeBB: false })}
                        className="mt-3 w-full rounded-lg border border-border/30 bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      >
                        Limpar filtro
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {historyEntries.length > 0 && (
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
                  Recentes
                </span>
                {historyEntries.map((entry) => (
                  <Tooltip key={entry.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onHistorySelect(entry.id)}
                        className="inline-flex max-w-[180px] items-center rounded-full border border-border/50 bg-card px-2.5 py-1 text-[11px] text-foreground/85 transition-[border-color,background-color,color] hover:border-primary/25 hover:bg-background hover:text-foreground dark:bg-card/55 dark:text-foreground/78 dark:hover:bg-card"
                      >
                        <span className="truncate">{entry.summaryLabel}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      sideOffset={8}
                      className="max-w-[260px] rounded-xl border border-border/60 bg-card px-3 py-2 text-left text-foreground shadow-xl"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-medium text-foreground">
                            {entry.summaryLabel}
                          </p>
                          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            {entry.interaction === 'selection' ? 'Selecao' : 'Busca'}
                          </span>
                        </div>
                        {entry.selectedTerm && entry.query !== entry.selectedTerm && (
                          <p className="text-[11px] text-muted-foreground">
                            Busca original: {entry.query}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          {entry.relativeLabel}
                        </p>
                        {entry.termSnapshot ? (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            <span>Score {entry.termSnapshot.score.toFixed(2)}</span>
                            <span>CTR {entry.termSnapshot.ctr.toFixed(2)}%</span>
                            <span>{entry.termSnapshot.actionLabel}</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">
                            Sem snapshot de metricas
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedTerm && (
          <div className="flex flex-col items-end justify-end gap-2 lg:flex-none lg:pb-[2px]">
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Modo das metricas
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Termo isolado ou cluster relacionado
              </p>
            </div>
            <div className="inline-flex rounded-xl border border-border/60 bg-card p-1 shadow-sm backdrop-blur-sm dark:bg-card/70">
              <button
                type="button"
                onClick={() => setMetricsView('individual')}
                aria-pressed={metricsView === 'individual'}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-[background-color,color,box-shadow] ${
                  metricsView === 'individual'
                    ? 'bg-background text-foreground shadow-[0_10px_24px_-18px_rgba(15,23,42,0.24)] dark:shadow-sm'
                    : 'text-foreground/68 hover:bg-black/[0.035] hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground'
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setMetricsView('aggregate')}
                aria-pressed={metricsView === 'aggregate'}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-[background-color,color,box-shadow] ${
                  metricsView === 'aggregate'
                    ? 'bg-background text-foreground shadow-[0_10px_24px_-18px_rgba(15,23,42,0.24)] dark:shadow-sm'
                    : 'text-foreground/68 hover:bg-black/[0.035] hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground'
                }`}
              >
                Agregadas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Term Analysis Card */}
      {selectedTerm && (
        <TermAnalysisCard
          term={selectedTerm}
          allData={filteredData}
          onTermSelect={onTermSelect}
          metricsView={metricsView}
          selectedTermBaseline={selectedTermBaseline}
        />
      )}

      {/* Cluster Visualization - The Main Feature */}
      <TermCluster 
        selectedTerm={selectedTerm} 
        allTerms={filteredData} 
        onTermSelect={onTermSelect}
      />

      {/* Empty State */}
      {!selectedTerm && (
        <Card className="border-border/60 border-dashed bg-gradient-to-br from-card to-muted/35 dark:to-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <Zap className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <p className="mt-6 text-center text-base font-medium text-foreground">
              Visualize o Cluster de Termos
            </p>
            <p className="mt-2 max-w-lg text-center text-sm text-muted-foreground">
              Busque um termo para ver a analise completa com visualizacao interativa
              de termos semanticamente relacionados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TermAnalysisCard({
  term,
  allData,
  onTermSelect,
  metricsView,
  selectedTermBaseline,
}: {
  term: EnrichedTermData
  allData: EnrichedTermData[]
  onTermSelect: (term: EnrichedTermData, query?: string) => void
  metricsView: 'aggregate' | 'individual'
  selectedTermBaseline: TermMetricBaseline | null
}) {
  const clusterMetrics = useMemo(() => calculateClusterMetrics(term, allData), [allData, term])
  const clusterTerms = useMemo(() => getClusterTerms(term, allData), [term, allData])
  const relatedClusters = useMemo(() => getRelatedClusters(term, allData, 5), [term, allData])
  const [selectedTerm, ...relatedTerms] = clusterMetrics.terms
  const [isRelatedTermsOpen, setIsRelatedTermsOpen] = useState(false)
  const [isClusterTermsOpen, setIsClusterTermsOpen] = useState(false)
  const [expandedClusterId, setExpandedClusterId] = useState<number | null>(null)
  const visibleRelatedTerms = relatedTerms.slice(0, 6)
  const isAggregateView = metricsView === 'aggregate'
  const currentScore = isAggregateView ? clusterMetrics.avgScore : selectedTerm.score
  const currentExpectedCTR = isAggregateView ? clusterMetrics.avgExpectedCTR : selectedTerm.expCTR
  const currentCTR = isAggregateView ? clusterMetrics.avgCTR : selectedTerm.ctr
  const currentAction = isAggregateView ? clusterMetrics.action : selectedTerm.action
  const currentPosition = isAggregateView ? clusterMetrics.avgPosition : selectedTerm.position
  const scoreColor = getScoreColor(currentScore, undefined, currentPosition)
  const fillWidth = Math.max(5, currentScore * 100)

  const stats = [
    {
      label: 'Impressoes',
      value: formatNumber(isAggregateView ? clusterMetrics.totalImpressions : selectedTerm.impressions),
      icon: Eye,
      delta: null,
    },
    {
      label: isAggregateView ? 'Posicao Media' : 'Posicao',
      value: isAggregateView ? clusterMetrics.avgPosition.toFixed(1) : selectedTerm.position.toFixed(1),
      icon: Target,
      delta: null,
    },
    {
      label: isAggregateView ? 'CTR do Cluster' : 'CTR',
      value: `${currentCTR.toFixed(2)}%`,
      icon: TrendingUp,
      delta: currentCTR > currentExpectedCTR ? '+' : '-',
    },
    {
      label: 'Cliques',
      value: formatNumber(isAggregateView ? clusterMetrics.totalClicks : selectedTerm.clicks),
      icon: MousePointerClick,
      delta: null,
    },
  ]

  return (
    <Card className="gap-0 overflow-hidden border-border/30 py-0 bg-gradient-to-br from-card via-card to-muted/10">
      {/* Header with Score */}
      <div
        className="relative overflow-hidden border-b border-border/30 px-6 py-5"
        style={{
          background: `linear-gradient(135deg, ${scoreColor}2e 0%, ${scoreColor}1f 46%, ${scoreColor}12 100%)`,
        }}
      >
        {/* Background decoration */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at 85% 10%, ${scoreColor} 0%, transparent 42%)`
          }}
        />
        
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge
                className="border-0 text-[10px] font-semibold"
                style={{
                  backgroundColor: `color-mix(in oklab, ${scoreColor} 16%, white)`,
                  color: scoreColor,
                  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${scoreColor} 42%, white)`,
                }}
              >
                Analise
              </Badge>
              <Badge variant="outline" className="border-border/50 bg-background/80 text-[10px] text-foreground/80 dark:border-border/40 dark:bg-background/20">
                {relatedTerms.length} relacionados
              </Badge>
              {clusterMetrics.clusterId !== undefined && (
                <Badge variant="outline" className="border-border/50 bg-background/80 text-[10px] text-foreground/80 dark:border-border/40 dark:bg-background/20">
                  Cluster #{clusterMetrics.clusterId}
                </Badge>
              )}
            </div>
            {clusterMetrics.clusterId !== undefined && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground/60">
                <span>{clusterMetrics.terms.length} termos</span>
                <span className="text-muted-foreground/40">|</span>
                <span>Score medio: {clusterMetrics.avgScore.toFixed(2)}</span>
                <span className="text-muted-foreground/40">|</span>
                <span>CTR: {clusterMetrics.avgCTR.toFixed(2)}%</span>
              </div>
            )}
            <h3 className="mt-2 text-xl font-semibold tracking-tight">{selectedTerm.term}</h3>
            <p className="mt-1 text-sm text-foreground/65">
              {isAggregateView
                ? 'Metricas agregadas do termo selecionado com o cluster semantico relacionado'
                : 'Metricas individuais do termo selecionado com acesso rapido aos relacionados'}
            </p>
            {/* Related Clusters Section */}
            {relatedClusters.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/60">
                  Clusters relacionados
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {relatedClusters.slice(0, 4).map((cluster) => (
                    <Popover
                      key={cluster.clusterId}
                      open={expandedClusterId === cluster.clusterId}
                      onOpenChange={(open) => setExpandedClusterId(open ? cluster.clusterId : null)}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-full border border-white/8 bg-background/16 px-3 py-1 text-[11px] text-foreground/82 transition-colors hover:bg-background/24 hover:text-foreground"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: getScoreColor(
                                cluster.avgScore,
                                undefined,
                                cluster.terms.reduce((sum, term) => sum + term.position, 0) / Math.max(cluster.terms.length, 1)
                              ),
                            }}
                          />
                          {cluster.name}
                          <span className="text-[10px] text-muted-foreground">
                            ({cluster.terms.length})
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        side="bottom"
                        sideOffset={8}
                        className="w-[260px] rounded-2xl border-border/50 bg-popover/95 p-3 shadow-2xl backdrop-blur-xl"
                      >
                        <div className="mb-2 flex items-center justify-between border-b border-border/30 pb-2">
                          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            {cluster.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Score: {cluster.avgScore.toFixed(2)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {cluster.terms.slice(0, 8).map((term) => (
                            <button
                              key={term.term}
                              type="button"
                              onClick={() => {
                                setExpandedClusterId(null)
                                onTermSelect(term)
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs hover:bg-muted/50"
                            >
                              <span className="truncate text-foreground/80">{term.term}</span>
                              <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                                {term.position.toFixed(1)}
                              </span>
                            </button>
                          ))}
                          {cluster.terms.length > 8 && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsRelatedTermsOpen(true)
                                setExpandedClusterId(null)
                              }}
                              className="w-full rounded-lg px-2 py-1 text-center text-[10px] text-muted-foreground hover:bg-muted/50"
                            >
                              +{cluster.terms.length - 8} mais
                            </button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                  {relatedClusters.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setIsRelatedTermsOpen(true)}
                      className="rounded-full border border-white/8 bg-background/10 px-3 py-1 text-[11px] text-foreground/55 transition-[background-color,color,border-color,transform] duration-200 ease-out hover:border-white/15 hover:bg-background/18 hover:text-foreground/82"
                    >
                      +{relatedClusters.length - 4}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Cluster Terms Box */}
            {clusterTerms.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setIsClusterTermsOpen(!isClusterTermsOpen)}
                  className="flex w-full items-center gap-2 text-left text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/60 hover:text-foreground/80"
                >
                  <ChevronRight className={`h-3 w-3 transition-transform ${isClusterTermsOpen ? 'rotate-90' : ''}`} />
                  Termos do cluster ({clusterTerms.length})
                </button>
                {isClusterTermsOpen && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {clusterTerms.map((clusterTerm) => (
                      <button
                        key={clusterTerm.term}
                        type="button"
                        onClick={() => onTermSelect(clusterTerm)}
                        className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                          clusterTerm.term === selectedTerm.term
                            ? 'border-primary/50 bg-primary/10 text-foreground'
                            : 'border-border/50 bg-background/50 text-foreground/70 hover:bg-background/80 hover:text-foreground'
                        }`}
                        style={clusterTerm.term === selectedTerm.term ? { borderColor: scoreColor } : {}}
                      >
                        {clusterTerm.term}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTermBaseline && (
              <div className="mt-4 rounded-2xl border border-white/8 bg-background/12 p-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/60">
                      Leitura historica
                    </p>
                    <p className="mt-1 text-xs text-foreground/82">
                      {selectedTermBaseline.sourceLabel}
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit border-white/10 bg-background/12 text-[10px] text-foreground/75">
                    {selectedTermBaseline.comparisonLabel}
                  </Badge>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-5">
                  <DeltaPill label="Score" delta={selectedTermBaseline.deltas.score} precision={2} />
                  <DeltaPill label="Posicao" delta={selectedTermBaseline.deltas.position} precision={1} />
                  <DeltaPill label="CTR" delta={selectedTermBaseline.deltas.ctr} suffix="%" precision={2} />
                  <DeltaPill label="Cliques" delta={selectedTermBaseline.deltas.clicks} compact />
                  <DeltaPill label="Impressoes" delta={selectedTermBaseline.deltas.impressions} compact />
                </div>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <div 
              className="text-4xl font-bold tracking-tighter"
              style={{ color: scoreColor }}
            >
              {currentScore.toFixed(2)}
            </div>
            <Badge
              className="mt-2 border-0 text-[10px] font-semibold uppercase"
              style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}
            >
              {getScoreLabel(currentScore, undefined, currentPosition)}
            </Badge>
          </div>
        </div>

        {/* Score Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Score RADAR</span>
            <span>{(fillWidth).toFixed(0)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/50">
            <div
              className="h-full rounded-full transition-[width,box-shadow] duration-1000 ease-out"
              style={{ 
                width: `${fillWidth}%`, 
                backgroundImage: `linear-gradient(90deg, color-mix(in oklab, ${scoreColor} 84%, white) 0%, ${scoreColor} 100%)`,
                boxShadow: `0 0 10px ${scoreColor}50`
              }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[9px] text-muted-foreground/60">
            <span>Evitar</span>
            <span>Avaliar</span>
            <span>Testar</span>
            <span>Investir</span>
          </div>
        </div>
      </div>

      <Dialog open={isRelatedTermsOpen} onOpenChange={setIsRelatedTermsOpen}>
        <DialogContent
          className="max-w-lg rounded-2xl border-border/50 p-0 shadow-2xl backdrop-blur-xl duration-200"
          style={{
            background: `linear-gradient(160deg, ${scoreColor}24 0%, ${scoreColor}18 38%, rgba(9,10,16,0.98) 100%)`,
          }}
          showCloseButton={false}
        >
          <div className="relative overflow-hidden rounded-[inherit]">
            <div
              className="absolute inset-0 opacity-70"
              aria-hidden="true"
              style={{
                background: `radial-gradient(circle at top right, ${scoreColor}40 0%, transparent 52%)`,
              }}
            />
            <div className="relative border-b border-border/40 px-5 py-4">
              <DialogHeader className="gap-1 text-left">
                <DialogTitle className="text-base tracking-tight">
                  Termos do cluster
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Metricas detalhadas para navegar sem poluir o card principal.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-5 py-4">
              {/* Header */}
              <div className="mb-3 grid grid-cols-5 gap-2 border-b border-border/30 pb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                <div className="col-span-2">Termo</div>
                <div className="text-right">Pos</div>
                <div className="text-right">CTR</div>
                <div className="text-right">Score</div>
              </div>

              {/* Terms list */}
              <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
                {clusterTerms.map((term, index) => (
                  <button
                    key={term.term}
                    type="button"
                    onClick={() => {
                      setIsRelatedTermsOpen(false)
                      onTermSelect(term)
                    }}
                    className="grid w-full grid-cols-5 items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50"
                    style={{
                      transitionDelay: `${Math.min(index * 18, 120)}ms`,
                    }}
                  >
                    <div className="col-span-2 flex items-center gap-2">
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: getScoreColor(term.score, undefined, term.position) }}
                      />
                      <span className="truncate text-xs text-foreground/85">{term.term}</span>
                    </div>
                    <div className="text-right font-mono text-xs text-muted-foreground">
                      {term.position.toFixed(1)}
                    </div>
                    <div className="text-right font-mono text-xs text-muted-foreground">
                      {term.ctr.toFixed(2)}%
                    </div>
                    <div className="text-right">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${getScoreColor(term.score, undefined, term.position)}18`,
                          color: getScoreColor(term.score, undefined, term.position),
                        }}
                      >
                        {term.score.toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CardContent className="p-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div 
                key={stat.label} 
                className="group rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className="h-3 w-3" />
                  <span className="text-[10px] uppercase tracking-wide">{stat.label}</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-lg font-semibold tracking-tight">{stat.value}</span>
                  {stat.delta && (
                    <span className={`text-[10px] ${stat.delta === '+' ? 'text-chart-1' : 'text-chart-4'}`}>
                      {stat.delta === '+' ? 'acima' : 'abaixo'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* CTR Comparison */}
        <div className="mt-4 rounded-xl border border-border/30 bg-muted/10 p-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">CTR Organico</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight">{currentCTR.toFixed(2)}%</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-px bg-border/50" />
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">CTR Esperado</p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-muted-foreground">
                  {currentExpectedCTR.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <div 
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: currentCTR > currentExpectedCTR ? '#10B981' : '#EF4444' }}
            />
            <span className="text-xs text-muted-foreground">
              {currentCTR > currentExpectedCTR 
                ? `${isAggregateView ? 'Cluster' : 'Termo'} ${((currentCTR / currentExpectedCTR - 1) * 100).toFixed(0)}% acima do esperado`
                : `${isAggregateView ? 'Cluster' : 'Termo'} ${((1 - currentCTR / currentExpectedCTR) * 100).toFixed(0)}% abaixo do esperado`
              }
            </span>
          </div>
        </div>

        {/* Action Recommendation */}
        <div 
          className="mt-4 rounded-xl p-4"
          style={{ backgroundColor: `${scoreColor}10`, borderLeft: `3px solid ${scoreColor}` }}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: scoreColor }} />
            <span className="text-sm font-medium">
              {isAggregateView ? 'Recomendacao do Cluster' : 'Recomendacao'}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {currentAction.label === 'Evitar' &&
              (isAggregateView
                ? 'O cluster ja possui bom desempenho geral. Vale manter a base atual e atacar oportunidades fora deste grupo.'
                : 'Este termo ja possui bom desempenho. Mantenha o conteudo atual e foque em outras oportunidades.')}
            {currentAction.label === 'Avaliar' &&
              (isAggregateView
                ? 'O cluster tem sinais mistos. Vale priorizar os termos relacionados com maior impressao para ganhar eficiencia.'
                : 'Avalie o custo-beneficio de otimizar este termo. Pode haver oportunidades de melhoria.')}
            {currentAction.label === 'Testar' &&
              (isAggregateView
                ? 'O cluster pede experimentacao. Testes de copy, snippets e cobertura de conteudo devem gerar ganho conjunto.'
                : 'Realize testes A/B com variacoes de conteudo para melhorar o CTR e posicionamento.')}
            {currentAction.label === 'Investir' &&
              (isAggregateView
                ? 'O cluster representa uma oportunidade real. Priorize conteudo, pagina de apoio e melhoria de destaque organico para o grupo.'
                : 'Alta prioridade para otimizacao. Invista em conteudo de qualidade e estrategias de SEO.')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function DeltaPill({
  label,
  delta,
  suffix = '',
  precision = 0,
  compact = false,
}: {
  label: string
  delta: TermMetricBaseline['deltas'][keyof TermMetricBaseline['deltas']]
  suffix?: string
  precision?: number
  compact?: boolean
}) {
  const isPositive = delta.direction === 'up'
  const isNeutral = delta.direction === 'flat'
  const toneClass = isNeutral
    ? 'border-white/8 bg-background/22 text-foreground/72'
    : isPositive
      ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
      : 'border-rose-400/20 bg-rose-500/10 text-rose-200'

  const Icon = isNeutral ? ArrowRight : isPositive ? ArrowUpRight : TrendingDown
  const currentValue = compact
    ? formatNumber(delta.current)
    : `${delta.current.toFixed(precision)}${suffix}`
  const baselineValue = compact
    ? formatNumber(delta.baseline)
    : `${delta.baseline.toFixed(precision)}${suffix}`

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.16em]">{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-1 text-sm font-semibold tracking-tight">{currentValue}</div>
      <div className="mt-1 text-[11px] opacity-80">
        antes {baselineValue}
      </div>
    </div>
  )
}
