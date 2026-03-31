'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_CONFIG,
  enrichTermData,
  filterRadarDataByDateRange,
  sanitizeRadarConfig,
  type DashboardDateRangeKey,
  type EnrichedTermData,
  type RadarConfig,
} from '@/lib/radar-data'
import {
  createTermMetricSnapshot,
  getConfigSnapshotHistory,
  getRecentSearchHistory,
  resolveTermMetricBaseline,
} from '@/lib/radar-history'
import {
  appendRadarConfigSnapshot,
  appendRadarSearchHistoryEntry,
  createRadarConfigSnapshot,
  createRadarSearchHistoryEntry,
  readRadarPersistenceState,
  writeRadarPersistenceState,
} from '@/lib/radar-persistence'
import {
  bootstrapRadarPersistenceState,
  getActiveRadarData,
  getActiveRadarDataSource,
  setActiveRadarDataSource,
} from '@/lib/radar-data-sources'

interface UseRadarDashboardStateOptions {
  initialDateRange?: DashboardDateRangeKey
}

export function useRadarDashboardState(
  options: UseRadarDashboardStateOptions = {}
) {
  const [dateRange, setDateRange] = useState<DashboardDateRangeKey>(options.initialDateRange ?? '90d')
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [selectedHistoryEntryId, setSelectedHistoryEntryId] = useState<string | null>(null)
  const [persistenceState, setPersistenceState] = useState(() =>
    bootstrapRadarPersistenceState(readRadarPersistenceState())
  )
  const [config, setConfig] = useState<RadarConfig>(() =>
    sanitizeRadarConfig(readRadarPersistenceState().currentConfig ?? DEFAULT_CONFIG)
  )
  const [savedConfig, setSavedConfig] = useState<RadarConfig>(() =>
    sanitizeRadarConfig(readRadarPersistenceState().currentConfig ?? DEFAULT_CONFIG)
  )

  const activeDataSource = useMemo(
    () => getActiveRadarDataSource(persistenceState),
    [persistenceState]
  )

  const rawData = useMemo(
    () => filterRadarDataByDateRange(getActiveRadarData(persistenceState), dateRange),
    [dateRange, persistenceState]
  )

  const isDirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(savedConfig),
    [config, savedConfig]
  )

  const recentSearchHistory = useMemo(
    () => getRecentSearchHistory(persistenceState.searchHistory),
    [persistenceState.searchHistory]
  )

  const configHistory = useMemo(
    () => getConfigSnapshotHistory(persistenceState.configSnapshots, savedConfig),
    [persistenceState.configSnapshots, savedConfig]
  )

  useEffect(() => {
    const nextState = bootstrapRadarPersistenceState(readRadarPersistenceState())
    const nextConfig = sanitizeRadarConfig(nextState.currentConfig ?? DEFAULT_CONFIG)

    setPersistenceState(nextState)
    setConfig(nextConfig)
    setSavedConfig(nextConfig)
  }, [])

  const persistState = useCallback((nextState: typeof persistenceState) => {
    const normalized = bootstrapRadarPersistenceState(nextState)
    const persisted = writeRadarPersistenceState(normalized)
    setPersistenceState(persisted)
    return persisted
  }, [])

  const updateConfig = useCallback((nextConfig: RadarConfig) => {
    setConfig(sanitizeRadarConfig(nextConfig))
  }, [])

  const saveConfig = useCallback((selectedTermSnapshot?: EnrichedTermData | null) => {
    const normalizedConfig = sanitizeRadarConfig(config)
    const snapshot = createRadarConfigSnapshot({
      config: normalizedConfig,
      selectedTerm,
      dataSourceId: activeDataSource.id,
      label: `Configuracao ${new Date().toLocaleString('pt-BR')}`,
      termSnapshot: selectedTermSnapshot ? createTermMetricSnapshot(selectedTermSnapshot) : null,
    })

    const nextState = appendRadarConfigSnapshot(
      {
        ...persistenceState,
        currentConfig: normalizedConfig,
      },
      snapshot
    )

    persistState(nextState)
    setConfig(normalizedConfig)
    setSavedConfig(normalizedConfig)
  }, [activeDataSource.id, config, persistState, persistenceState, selectedTerm])

  const resetConfig = useCallback(() => {
    const normalizedConfig = sanitizeRadarConfig(DEFAULT_CONFIG)
    const nextState = {
      ...persistenceState,
      currentConfig: normalizedConfig,
    }

    persistState(nextState)
    setConfig(normalizedConfig)
    setSavedConfig(normalizedConfig)
  }, [persistState, persistenceState])

  const changeActiveDataSource = useCallback(
    (sourceId: string) => {
      const nextState = setActiveRadarDataSource(persistenceState, sourceId)
      persistState(nextState)
      setSelectedTerm(null)
    },
    [persistState, persistenceState]
  )

  const recordSelection = useCallback(
    (term: EnrichedTermData, query?: string) => {
      const nextEntry = createRadarSearchHistoryEntry({
        query: query?.trim() || term.term,
        selectedTerm: term.term,
        dataSourceId: activeDataSource.id,
        interaction: 'selection',
        termSnapshot: createTermMetricSnapshot(term),
      })

      const nextState = appendRadarSearchHistoryEntry(
        persistenceState,
        nextEntry
      )

      persistState(nextState)
      setSelectedTerm(term.term)
      setSelectedHistoryEntryId(nextEntry.id)
    },
    [activeDataSource.id, persistState, persistenceState]
  )

  const restoreSearchHistoryEntry = useCallback(
    (entryId: string) => {
      const targetEntry = persistenceState.searchHistory.find((entry) => entry.id === entryId)

      if (!targetEntry) {
        return
      }

      const nextState =
        targetEntry.dataSourceId !== persistenceState.activeDataSourceId
          ? setActiveRadarDataSource(persistenceState, targetEntry.dataSourceId)
          : persistenceState

      if (nextState !== persistenceState) {
        persistState(nextState)
      }

      setSelectedTerm(targetEntry.selectedTerm)
      setSelectedHistoryEntryId(targetEntry.id)
    },
    [persistState, persistenceState]
  )

  const restoreConfigSnapshot = useCallback(
    (snapshotId: string) => {
      const targetSnapshot = persistenceState.configSnapshots.find((snapshot) => snapshot.id === snapshotId)

      if (!targetSnapshot) {
        return
      }

      const normalizedConfig = sanitizeRadarConfig(targetSnapshot.config)
      const nextStateBase =
        targetSnapshot.dataSourceId && targetSnapshot.dataSourceId !== persistenceState.activeDataSourceId
          ? setActiveRadarDataSource(persistenceState, targetSnapshot.dataSourceId)
          : persistenceState

      const nextState = {
        ...nextStateBase,
        currentConfig: normalizedConfig,
      }

      persistState(nextState)
      setConfig(normalizedConfig)
      setSavedConfig(normalizedConfig)
      setSelectedTerm(targetSnapshot.selectedTerm ?? null)
      setSelectedHistoryEntryId(null)
    },
    [persistState, persistenceState]
  )

  const selectedTermBaseline = useMemo(() => {
    if (!selectedTerm) {
      return null
    }

    const selectedEntry = rawData.find((entry) => entry.term === selectedTerm)

    if (!selectedEntry) {
      return null
    }

    const enrichedSelection = enrichTermData([selectedEntry], config)[0]

    return resolveTermMetricBaseline({
      term: enrichedSelection,
      searchHistory: persistenceState.searchHistory,
      configSnapshots: persistenceState.configSnapshots,
      currentConfig: config,
      dataSourceId: activeDataSource.id,
      currentHistoryEntryId: selectedHistoryEntryId,
    })
  }, [
    activeDataSource.id,
    config,
    persistenceState.configSnapshots,
    persistenceState.searchHistory,
    rawData,
    selectedHistoryEntryId,
    selectedTerm,
  ])

  return {
    activeDataSource,
    config,
    configHistory,
    configSnapshots: persistenceState.configSnapshots,
    dataSources: persistenceState.dataSources,
    dateRange,
    isDirty,
    rawData,
    savedConfig,
    searchHistoryEntries: recentSearchHistory,
    searchHistory: persistenceState.searchHistory,
    selectedTerm,
    selectedTermBaseline,
    setDateRange,
    setSelectedTerm,
    changeActiveDataSource,
    recordSelection,
    resetConfig,
    restoreConfigSnapshot,
    restoreSearchHistoryEntry,
    saveConfig,
    updateConfig,
  }
}
