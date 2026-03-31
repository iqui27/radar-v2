'use client'

import { useMemo, useRef, useState } from 'react'
import {
  CalendarRange,
  Check,
  ChevronDown,
  Database,
  FileUp,
  Moon,
  Radar,
  Sun,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { RadarDataSourceRecord } from '@/lib/radar-schemas'
import type { RadarImportResult } from '@/lib/radar-import'
import {
  DASHBOARD_DATE_RANGES,
  getDashboardDateRange,
  type DashboardDateRangeKey,
} from '@/lib/radar-data'

interface HeaderProps {
  theme: 'light' | 'dark'
  dateRange: DashboardDateRangeKey
  activeDataSource: RadarDataSourceRecord
  dataSources: RadarDataSourceRecord[]
  onDataSourceChange: (sourceId: string) => void
  onImportDataSource: (
    file: File,
    options?: { label?: string; notes?: string; activate?: boolean }
  ) => Promise<RadarImportResult>
  onDateRangeChange: (range: DashboardDateRangeKey) => void
  onThemeToggle: () => void
}

function formatSourceDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function Header({
  theme,
  dateRange,
  activeDataSource,
  dataSources,
  onDataSourceChange,
  onImportDataSource,
  onDateRangeChange,
  onThemeToggle,
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importFeedback, setImportFeedback] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)

  const selectedRange = getDashboardDateRange(dateRange)
  const periodLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
    const endDate = new Date()
    const startDate = new Date()

    startDate.setDate(endDate.getDate() - (selectedRange.days - 1))

    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
  }, [selectedRange.days])

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsImporting(true)
    setImportFeedback(null)

    try {
      const result = await onImportDataSource(file, { activate: true })

      if (result.success) {
        const warningLabel =
          result.warnings.length > 0 ? ` • ${result.warnings[0]?.message}` : ''
        setImportFeedback({
          tone: 'success',
          message: `${result.summary.importedCount} termos importados em ${result.label}.${warningLabel}`,
        })
      } else {
        const firstIssues = result.issues.slice(0, 2).map((issue) => issue.message).join(' • ')
        setImportFeedback({
          tone: 'error',
          message: firstIssues || 'Nao foi possivel importar o arquivo selecionado.',
        })
      }
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  return (
    <header className="relative overflow-hidden border-b border-border/30 bg-background py-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="mx-auto w-full max-w-[1720px] px-5 sm:px-7 lg:px-10 xl:px-12 2xl:px-14">
        <div className="radar-shell-surface flex flex-col gap-4 rounded-[28px] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/18 via-primary/10 to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="absolute inset-[6px] rounded-[14px] border border-black/8 dark:border-white/6" />
              <Radar className="relative z-10 h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[1.75rem] font-semibold tracking-[-0.04em] text-foreground">
                  RADAR
                </h1>
                <span className="radar-chip rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Search Intelligence
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground/85">
                Indicador de Otimizacao de Busca
              </p>
            </div>
          </div>

          <div className="radar-toolbar-surface flex flex-wrap items-center gap-1.5 self-start rounded-[20px] p-1 md:self-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,.txt"
              className="hidden"
              onChange={handleImportFile}
            />

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="group flex min-w-[196px] items-center gap-2.5 rounded-[16px] border border-transparent bg-transparent px-2.5 py-1.5 text-left transition-[border-color,background-color,transform] duration-200 hover:border-black/8 hover:bg-black/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:hover:border-white/6 dark:hover:bg-background/45"
                  aria-label={`Origem ativa: ${activeDataSource.label}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                    <Database className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Origem ativa
                    </div>
                    <div className="mt-0.5 truncate text-[13px] font-semibold tracking-tight text-foreground">
                      {activeDataSource.label}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {activeDataSource.recordCount} termos • {formatSourceDate(activeDataSource.createdAt)}
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[380px] rounded-2xl border-border/50 bg-popover/95 p-2 shadow-2xl backdrop-blur-xl"
              >
                <div className="px-3 pb-2 pt-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    Origens de dados
                  </p>
                  <p className="mt-1 text-sm font-medium tracking-tight text-foreground">
                    Troque a base ativa ou importe um novo CSV
                  </p>
                </div>

                <div className="space-y-1">
                  {dataSources.map((source) => {
                    const isActive = source.id === activeDataSource.id
                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => {
                          setImportFeedback(null)
                          onDataSourceChange(source.id)
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-[background-color,border-color,color] ${
                          isActive
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{source.label}</span>
                            <span className="rounded-full border border-border/50 bg-background/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {source.kind === 'embedded' ? 'Base' : 'Importada'}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {source.recordCount} termos • {formatSourceDate(source.createdAt)}
                          </p>
                        </div>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border/50 bg-background/80">
                          {isActive ? (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-muted-foreground/25" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-2 border-t border-border/40 px-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImportClick}
                    disabled={isImporting}
                    className="w-full justify-center rounded-xl border-border/50 bg-background/50"
                  >
                    <FileUp className="h-4 w-4" />
                    {isImporting ? 'Importando CSV...' : 'Importar novo CSV'}
                  </Button>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Esperado: colunas de termo, cliques, impressoes, ctr e posicao. CSV UTF-8.
                  </p>
                  {importFeedback && (
                    <div
                      className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
                        importFeedback.tone === 'success'
                          ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                          : 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                      }`}
                    >
                      {importFeedback.message}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="group flex items-center gap-2.5 rounded-[16px] border border-transparent bg-transparent px-2.5 py-1.5 text-left transition-[border-color,background-color,transform] duration-200 hover:border-black/8 hover:bg-black/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:hover:border-white/6 dark:hover:bg-background/45"
                  aria-label={`Selecionar periodo de analise. Atual: ${selectedRange.label}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                    <CalendarRange className="h-3.5 w-3.5" />
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Periodo
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13px] font-semibold tracking-tight text-foreground">
                        {selectedRange.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{periodLabel}</span>
                    </div>
                  </div>
                  <div className="sm:hidden">
                    <span className="text-xs font-semibold tracking-tight text-foreground">
                      {selectedRange.shortLabel}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[320px] rounded-2xl border-border/50 bg-popover/95 p-2 shadow-2xl backdrop-blur-xl">
                <div className="px-3 pb-2 pt-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    Filtro global
                  </p>
                  <p className="mt-1 text-sm font-medium tracking-tight text-foreground">
                    Periodo de leitura do dashboard
                  </p>
                </div>
                <div className="space-y-1">
                  {DASHBOARD_DATE_RANGES.map((option) => {
                    const isActive = option.key === dateRange

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => onDateRangeChange(option.key)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-[background-color,border-color,color] ${
                          isActive
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{option.label}</span>
                            <span className="rounded-full border border-border/50 bg-background/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {option.shortLabel}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border/50 bg-background/80">
                          {isActive ? (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-muted-foreground/25" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={onThemeToggle}
              className="h-10 w-10 rounded-[18px] border border-transparent bg-transparent text-muted-foreground transition-[background-color,border-color,color,transform] duration-200 hover:border-black/8 hover:bg-black/[0.035] hover:text-foreground dark:hover:border-white/6 dark:hover:bg-background/45"
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
