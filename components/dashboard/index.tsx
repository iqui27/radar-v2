'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { LayoutGrid, Search, Settings, Table2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from './header'
import { KPICards, ScoreDistribution } from './kpi-cards'
import { RadarScatterChart } from './scatter-chart'
import { DataTable } from './data-table'
import { SearchPanel } from './search-panel'
import { ConfigPanel } from './config-panel'
import { ScoreDistributionChart, TopTermsChart } from './distribution-chart'
import {
  enrichTermData,
  calculateKPIs,
  type EnrichedTermData,
} from '@/lib/radar-data'
import { useRadarDashboardState } from '@/hooks/use-radar-dashboard'

export function Dashboard() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [activeTab, setActiveTab] = useState('panorama')
  const [panoramaView, setPanoramaView] = useState<'scatter' | 'table'>('scatter')
  const {
    activeDataSource,
    config,
    configHistory,
    changeActiveDataSource,
    dataSources,
    dateRange,
    importDataSource,
    isDirty,
    rawData,
    searchHistoryEntries,
    selectedTerm,
    selectedTermBaseline,
    setDateRange,
    setSelectedTerm,
    recordSelection,
    resetConfig,
    restoreConfigSnapshot,
    restoreSearchHistoryEntry,
    saveConfig,
    updateConfig,
  } = useRadarDashboardState()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  const enrichedData = useMemo(() => {
    return enrichTermData(rawData, config)
  }, [config, rawData])

  const kpis = useMemo(() => {
    return calculateKPIs(enrichedData)
  }, [enrichedData])

  useEffect(() => {
    if (!selectedTerm) {
      return
    }

    const nextSelectedTerm = enrichedData.find((term) => term.term === selectedTerm) ?? null

    if (!nextSelectedTerm) {
      setSelectedTerm(null)
      return
    }
  }, [enrichedData, selectedTerm])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  const handleTermSelect = useCallback(
    (term: string, query?: string) => {
      const found = enrichedData.find((d) => d.term === term)
      if (found) {
        recordSelection(found, query)
        setActiveTab('consulta')
      }
    },
    [enrichedData, recordSelection]
  )

  const selectedEnrichedTerm = useMemo<EnrichedTermData | null>(() => {
    if (!selectedTerm) {
      return null
    }

    return enrichedData.find((term) => term.term === selectedTerm) ?? null
  }, [enrichedData, selectedTerm])

  return (
    <div className="min-h-screen bg-background">
      <Header
        theme={theme}
        dateRange={dateRange}
        activeDataSource={activeDataSource}
        dataSources={dataSources}
        onDataSourceChange={changeActiveDataSource}
        onImportDataSource={importDataSource}
        onDateRangeChange={setDateRange}
        onThemeToggle={toggleTheme}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
        <div className="relative z-10 -mt-4">
          <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
            <div className="overflow-x-auto pb-2">
              <div className="inline-flex rounded-[24px] border border-white/6 bg-card/72 p-1.5 shadow-[0_18px_60px_-38px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                <TabsList className="h-auto gap-1 rounded-[20px] border-0 bg-transparent p-0">
                  <TabsTrigger
                    value="panorama"
                    className="group relative gap-2 whitespace-nowrap rounded-[18px] border border-transparent px-4 py-3 text-xs font-medium text-muted-foreground transition-[background-color,border-color,color,box-shadow,transform] duration-200 data-[state=active]:border-white/8 data-[state=active]:bg-[linear-gradient(180deg,rgba(18,20,30,0.98),rgba(13,14,22,0.92))] data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_-18px_rgba(0,0,0,0.9)]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-transparent bg-background/35 text-muted-foreground transition-[background-color,color,border-color] duration-200 group-data-[state=active]:border-primary/15 group-data-[state=active]:bg-primary/12 group-data-[state=active]:text-primary">
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </span>
                    Panorama
                  </TabsTrigger>
                  <TabsTrigger
                    value="consulta"
                    className="group relative gap-2 whitespace-nowrap rounded-[18px] border border-transparent px-4 py-3 text-xs font-medium text-muted-foreground transition-[background-color,border-color,color,box-shadow,transform] duration-200 data-[state=active]:border-white/8 data-[state=active]:bg-[linear-gradient(180deg,rgba(18,20,30,0.98),rgba(13,14,22,0.92))] data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_-18px_rgba(0,0,0,0.9)]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-transparent bg-background/35 text-muted-foreground transition-[background-color,color,border-color] duration-200 group-data-[state=active]:border-primary/15 group-data-[state=active]:bg-primary/12 group-data-[state=active]:text-primary">
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    Consulta
                  </TabsTrigger>
                  <TabsTrigger
                    value="configuracao"
                    className="group relative gap-2 whitespace-nowrap rounded-[18px] border border-transparent px-4 py-3 text-xs font-medium text-muted-foreground transition-[background-color,border-color,color,box-shadow,transform] duration-200 data-[state=active]:border-white/8 data-[state=active]:bg-[linear-gradient(180deg,rgba(18,20,30,0.98),rgba(13,14,22,0.92))] data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_-18px_rgba(0,0,0,0.9)]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-transparent bg-background/35 text-muted-foreground transition-[background-color,color,border-color] duration-200 group-data-[state=active]:border-primary/15 group-data-[state=active]:bg-primary/12 group-data-[state=active]:text-primary">
                      <Settings className="h-3.5 w-3.5" />
                    </span>
                    Configuracao
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <TabsContent value="panorama" className="mt-0 min-w-0 space-y-6">
            {/* KPIs */}
            <KPICards {...kpis} />

            {/* Score Distribution + View Toggle */}
            <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card/50 p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <ScoreDistribution distribution={kpis.scoreDistribution} />
              </div>
              <div className="flex gap-1 self-start rounded-lg bg-muted/50 p-1 md:self-auto">
                <button
                  type="button"
                  onClick={() => setPanoramaView('scatter')}
                  aria-pressed={panoramaView === 'scatter'}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-[background-color,color,box-shadow] ${
                    panoramaView === 'scatter'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Dispersao
                </button>
                <button
                  type="button"
                  onClick={() => setPanoramaView('table')}
                  aria-pressed={panoramaView === 'table'}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-[background-color,color,box-shadow] ${
                    panoramaView === 'table'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Table2 className="h-3.5 w-3.5" />
                  Tabela
                </button>
              </div>
            </div>

            {/* Main Content */}
            {panoramaView === 'scatter' ? (
              <div className="min-w-0 space-y-6">
                <RadarScatterChart data={enrichedData} highlightTerm={selectedEnrichedTerm?.term} />
                <div className="grid gap-4 xl:grid-cols-2">
                  <ScoreDistributionChart data={enrichedData} />
                  <TopTermsChart data={enrichedData} />
                </div>
              </div>
            ) : (
              <DataTable data={enrichedData} onTermSelect={handleTermSelect} />
            )}
          </TabsContent>

          <TabsContent value="consulta" className="mt-0">
            <SearchPanel
              data={enrichedData}
              historyEntries={searchHistoryEntries}
              onHistorySelect={restoreSearchHistoryEntry}
              onTermSelect={(term, query) => {
                recordSelection(term, query)
              }}
              selectedTerm={selectedEnrichedTerm}
              selectedTermBaseline={selectedTermBaseline}
            />
          </TabsContent>

          <TabsContent value="configuracao" className="mt-0">
            <ConfigPanel
              config={config}
              configHistory={configHistory}
              data={enrichedData}
              onConfigChange={updateConfig}
              onRestoreSnapshot={restoreConfigSnapshot}
              onSave={() => saveConfig(selectedEnrichedTerm)}
              onReset={resetConfig}
              isDirty={isDirty}
            />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  )
}
