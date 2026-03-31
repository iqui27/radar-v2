'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, Search, ArrowUp, ArrowDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { EnrichedTermData } from '@/lib/radar-data'
import { getScoreColor } from '@/lib/radar-data'

interface DataTableProps {
  data: EnrichedTermData[]
  onTermSelect?: (term: string) => void
}

type SortKey = 'term' | 'score' | 'action' | 'position' | 'ctr' | 'expCTR' | 'clicks' | 'impressions'

export function DataTable({ data, onTermSelect }: DataTableProps) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortAsc, setSortAsc] = useState(false)
  const [visibleRows, setVisibleRows] = useState<100 | 250 | 500 | 'all'>(250)

  const filteredAndSortedData = useMemo(() => {
    let filtered = data
    
    if (search) {
      const query = search.toLowerCase()
      filtered = data.filter(d => d.term.toLowerCase().includes(query))
    }

    return [...filtered].sort((a, b) => {
      let va: string | number
      let vb: string | number

      if (sortKey === 'action') {
        va = a.action.label
        vb = b.action.label
      } else {
        va = a[sortKey]
        vb = b[sortKey]
      }

      if (typeof va === 'string') {
        return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
      }
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
  }, [data, search, sortKey, sortAsc])

  const visibleData = useMemo(() => {
    if (search || visibleRows === 'all') {
      return filteredAndSortedData
    }

    return filteredAndSortedData.slice(0, visibleRows)
  }, [filteredAndSortedData, search, visibleRows])

  const hasWindowLimit =
    !search && visibleRows !== 'all' && filteredAndSortedData.length > visibleRows

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const SortHeader = ({ label, sortKeyName, className = '' }: { label: string; sortKeyName: SortKey; className?: string }) => (
    <button
      type="button"
      className={`group flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground ${className}`}
      onClick={() => handleSort(sortKeyName)}
    >
      {label}
      <span className="opacity-0 transition-opacity group-hover:opacity-100">
        {sortKey === sortKeyName ? (
          sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3" />
        )}
      </span>
    </button>
  )

  return (
    <Card className="overflow-hidden border-border/60 bg-card shadow-[0_18px_46px_-34px_rgba(15,23,42,0.14)] dark:shadow-none">
      <CardHeader className="border-b border-border/60 bg-muted/30 px-5 py-4 dark:border-border/30 dark:bg-muted/20">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-sm font-medium">
                Tabela de Termos
              </CardTitle>
              <CardDescription className="text-xs">
                {search
                  ? `${filteredAndSortedData.length} resultados para "${search}"`
                  : `Mostrando ${visibleData.length} de ${data.length} termos na ordenacao atual`}
              </CardDescription>
            </div>
            <div className="relative w-full max-w-sm md:w-72">
              <label htmlFor="table-search" className="sr-only">
                Buscar termo na tabela
              </label>
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="table-search"
                name="table-search"
                aria-label="Buscar termo na tabela"
                autoComplete="off"
                placeholder="Buscar termo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 border-border/50 bg-background pl-9 text-xs"
              />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Janela
              </span>
              {[100, 250, 500, 'all'].map((option) => {
                const isActive = visibleRows === option

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setVisibleRows(option as 100 | 250 | 500 | 'all')}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-[background-color,border-color,color] ${
                      isActive
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border/60 bg-background text-muted-foreground hover:text-foreground dark:border-border/50 dark:bg-background/50'
                    }`}
                  >
                    {option === 'all' ? 'Tudo' : option}
                  </button>
                )
              })}
              <span className="text-[11px] text-muted-foreground">
                {search
                  ? 'Busca mostra todos os resultados encontrados.'
                  : 'Amplie a janela se quiser inspecionar a cauda longa.'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[420px] overflow-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm dark:bg-muted/80">
              <tr className="border-b border-border/40 dark:border-border/30">
                <th className="px-4 py-3 text-left"><SortHeader label="Termo" sortKeyName="term" /></th>
                <th className="px-4 py-3 text-left"><SortHeader label="Score" sortKeyName="score" /></th>
                <th className="hidden px-4 py-3 text-left md:table-cell"><SortHeader label="Acao" sortKeyName="action" /></th>
                <th className="px-4 py-3 text-right"><SortHeader label="Pos" sortKeyName="position" className="justify-end" /></th>
                <th className="px-4 py-3 text-right"><SortHeader label="CTR" sortKeyName="ctr" className="justify-end" /></th>
                <th className="hidden px-4 py-3 text-right lg:table-cell"><SortHeader label="CTR Esp." sortKeyName="expCTR" className="justify-end" /></th>
                <th className="px-4 py-3 text-right"><SortHeader label="Cliques" sortKeyName="clicks" className="justify-end" /></th>
                <th className="hidden px-4 py-3 text-right md:table-cell"><SortHeader label="Impr." sortKeyName="impressions" className="justify-end" /></th>
              </tr>
            </thead>
            <tbody>
              {visibleData.map((d) => (
                <tr
                  key={d.term}
                  className="group border-b border-border/30 transition-colors hover:bg-muted/40 dark:border-border/20 dark:hover:bg-muted/30"
                >
                  <td className="px-4 py-2.5">
                    {onTermSelect ? (
                      <button
                        type="button"
                        className="text-left text-xs font-medium transition-colors hover:text-primary focus-visible:text-primary"
                        onClick={() => onTermSelect(d.term)}
                        aria-label={`Abrir analise do termo ${d.term}`}
                      >
                        {d.term}
                      </button>
                    ) : (
                      <span className="text-xs font-medium">{d.term}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: getScoreColor(d.score) }}
                      />
                      <span className="font-mono text-xs">
                        {d.score.toFixed(3)}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-2.5 md:table-cell">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ 
                        backgroundColor: `${getScoreColor(d.score)}15`,
                        color: getScoreColor(d.score)
                      }}
                    >
                      {d.action.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                    {d.position.toFixed(1)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                    {d.ctr.toFixed(1)}%
                  </td>
                  <td className="hidden px-4 py-2.5 text-right font-mono text-xs text-muted-foreground lg:table-cell">
                    {d.expCTR.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">
                    {d.clicks.toLocaleString()}
                  </td>
                  <td className="hidden px-4 py-2.5 text-right font-mono text-xs text-muted-foreground md:table-cell">
                    {d.impressions.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAndSortedData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhum termo encontrado
              </p>
            </div>
          )}
          {hasWindowLimit && (
            <div className="border-t border-border/40 bg-muted/20 px-4 py-3 text-[11px] text-muted-foreground dark:border-border/30 dark:bg-muted/10">
              A tabela mostra os {visibleRows} primeiros termos da ordenacao atual para manter leitura e performance. Use a busca ou amplie a janela para aprofundar.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
