'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_CONFIG,
  filterRadarDataByDateRange,
  sanitizeRadarConfig,
  type DashboardDateRangeKey,
  type RadarConfig,
} from '@/lib/radar-data'
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

  const saveConfig = useCallback(() => {
    const normalizedConfig = sanitizeRadarConfig(config)
    const snapshot = createRadarConfigSnapshot({
      config: normalizedConfig,
      selectedTerm,
      dataSourceId: activeDataSource.id,
      label: `Configuracao ${new Date().toLocaleString('pt-BR')}`,
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
    (term: string, query?: string) => {
      const nextState = appendRadarSearchHistoryEntry(
        persistenceState,
        createRadarSearchHistoryEntry({
          query: query ?? term,
          selectedTerm: term,
          dataSourceId: activeDataSource.id,
          interaction: 'selection',
        })
      )

      persistState(nextState)
      setSelectedTerm(term)
    },
    [activeDataSource.id, persistState, persistenceState]
  )

  return {
    activeDataSource,
    config,
    configSnapshots: persistenceState.configSnapshots,
    dataSources: persistenceState.dataSources,
    dateRange,
    isDirty,
    rawData,
    savedConfig,
    searchHistory: persistenceState.searchHistory,
    selectedTerm,
    setDateRange,
    setSelectedTerm,
    changeActiveDataSource,
    recordSelection,
    resetConfig,
    saveConfig,
    updateConfig,
  }
}
