'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
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
  appendRadarSearchHistoryEntry,
  createEmptyRadarPersistenceState,
  createRadarConfigSnapshot,
  createRadarSearchHistoryEntry,
  createEmptyRadarGlobalConfigState,
  deleteRadarGlobalConfigSnapshot,
  fetchRadarGlobalConfigState,
  readLegacyRadarPersistenceState,
  readRadarPersistenceState,
  updateRadarGlobalConfig,
  appendRadarGlobalConfigSnapshot,
  writeRadarPersistenceState,
} from '@/lib/radar-persistence'
import {
  bootstrapRadarPersistenceState,
  getActiveRadarData,
  getActiveRadarDataSource,
  registerImportedRadarDataSource,
  setActiveRadarDataSource,
} from '@/lib/radar-data-sources'
import { parseRadarImportFile, type RadarImportResult } from '@/lib/radar-import'

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
    bootstrapRadarPersistenceState(createEmptyRadarPersistenceState())
  )
  const [globalConfigState, setGlobalConfigState] = useState(() =>
    createEmptyRadarGlobalConfigState()
  )
  const [config, setConfig] = useState<RadarConfig>(() => sanitizeRadarConfig(DEFAULT_CONFIG))
  const [savedConfig, setSavedConfig] = useState<RadarConfig>(() => sanitizeRadarConfig(DEFAULT_CONFIG))
  const [globalConfigStatus, setGlobalConfigStatus] = useState<'idle' | 'loading' | 'ready' | 'saving' | 'error'>('idle')
  const [globalConfigError, setGlobalConfigError] = useState<string | null>(null)

  const activeDataSource = useMemo(
    () => getActiveRadarDataSource(persistenceState),
    [persistenceState]
  )

  const sortedDataSources = useMemo(
    () =>
      [...persistenceState.dataSources].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [persistenceState.dataSources]
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
    () => getConfigSnapshotHistory(globalConfigState.configSnapshots, savedConfig),
    [globalConfigState.configSnapshots, savedConfig]
  )

  useEffect(() => {
    const nextState = bootstrapRadarPersistenceState(readRadarPersistenceState())
    const legacyState = readLegacyRadarPersistenceState()

    setPersistenceState(nextState)

    let cancelled = false

    const loadGlobalConfig = async () => {
      setGlobalConfigStatus('loading')

      try {
        const payload = await fetchRadarGlobalConfigState()

        let nextGlobalState = payload.state

        if (
          payload.source === 'default' &&
          legacyState &&
          (legacyState.currentConfig || legacyState.configSnapshots.length > 0)
        ) {
          nextGlobalState = await updateRadarGlobalConfig(
            sanitizeRadarConfig(legacyState.currentConfig ?? DEFAULT_CONFIG)
          )

          if (legacyState.configSnapshots.length > 0) {
            nextGlobalState = await updateRadarGlobalConfig(nextGlobalState.currentConfig)
            nextGlobalState = await (await fetch('/api/radar-config', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                currentConfig: nextGlobalState.currentConfig,
                configSnapshots: legacyState.configSnapshots,
              }),
            }).then(async (response) => {
              if (!response.ok) {
                const payload = await response.json().catch(() => null)
                throw new Error(payload?.error ?? 'Falha ao migrar configuracao local anterior.')
              }

              const payload = await response.json()
              return payload.state
            }))
          }
        }

        if (cancelled) return

        const normalizedConfig = sanitizeRadarConfig(nextGlobalState.currentConfig)
        setGlobalConfigState(nextGlobalState)
        setConfig(normalizedConfig)
        setSavedConfig(normalizedConfig)
        setGlobalConfigError(null)
        setGlobalConfigStatus('ready')
      } catch (error) {
        if (cancelled) return

        const message =
          error instanceof Error ? error.message : 'Falha ao carregar a configuracao global.'

        setGlobalConfigState(createEmptyRadarGlobalConfigState())
        setConfig(sanitizeRadarConfig(DEFAULT_CONFIG))
        setSavedConfig(sanitizeRadarConfig(DEFAULT_CONFIG))
        setGlobalConfigError(message)
        setGlobalConfigStatus('error')
        toast.error(message)
      }
    }

    loadGlobalConfig()

    return () => {
      cancelled = true
    }
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

  const saveConfig = useCallback(async (selectedTermSnapshot?: EnrichedTermData | null) => {
    const normalizedConfig = sanitizeRadarConfig(config)
    const snapshot = createRadarConfigSnapshot({
      config: normalizedConfig,
      selectedTerm,
      dataSourceId: activeDataSource.id,
      label: `Configuracao ${new Date().toLocaleString('pt-BR')}`,
      termSnapshot: selectedTermSnapshot ? createTermMetricSnapshot(selectedTermSnapshot) : null,
    })

    try {
      setGlobalConfigStatus('saving')
      const nextGlobalState = await appendRadarGlobalConfigSnapshot(snapshot)
      setGlobalConfigState(nextGlobalState)
      setConfig(normalizedConfig)
      setSavedConfig(normalizedConfig)
      setGlobalConfigError(null)
      setGlobalConfigStatus('ready')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao salvar a configuracao global.'
      setGlobalConfigError(message)
      setGlobalConfigStatus('error')
      toast.error(message)
    }
  }, [activeDataSource.id, config, selectedTerm])

  const resetConfig = useCallback(async () => {
    const normalizedConfig = sanitizeRadarConfig(DEFAULT_CONFIG)

    try {
      setGlobalConfigStatus('saving')
      const nextGlobalState = await updateRadarGlobalConfig(normalizedConfig)
      setGlobalConfigState(nextGlobalState)
      setConfig(normalizedConfig)
      setSavedConfig(normalizedConfig)
      setGlobalConfigError(null)
      setGlobalConfigStatus('ready')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao resetar a configuracao global.'
      setGlobalConfigError(message)
      setGlobalConfigStatus('error')
      toast.error(message)
    }
  }, [])

  const changeActiveDataSource = useCallback(
    (sourceId: string) => {
      const nextState = setActiveRadarDataSource(persistenceState, sourceId)
      persistState(nextState)
      setSelectedTerm(null)
      setSelectedHistoryEntryId(null)
    },
    [persistState, persistenceState]
  )

  const importDataSource = useCallback(
    async (
      file: File,
      options: {
        label?: string
        notes?: string
        activate?: boolean
      } = {}
    ): Promise<RadarImportResult> => {
      const parsed = await parseRadarImportFile(file, {
        label: options.label,
      })

      if (!parsed.success) {
        return parsed
      }

      const nextState = registerImportedRadarDataSource(persistenceState, {
        label: parsed.label,
        data: parsed.data,
        filename: file.name,
        notes: options.notes,
        activate: options.activate ?? true,
      })

      persistState(nextState)
      setSelectedTerm(null)
      setSelectedHistoryEntryId(null)

      return parsed
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
    async (snapshotId: string) => {
      const targetSnapshot = globalConfigState.configSnapshots.find((snapshot) => snapshot.id === snapshotId)

      if (!targetSnapshot) {
        return
      }

      const normalizedConfig = sanitizeRadarConfig(targetSnapshot.config)
      const nextStateBase =
        targetSnapshot.dataSourceId && targetSnapshot.dataSourceId !== persistenceState.activeDataSourceId
          ? setActiveRadarDataSource(persistenceState, targetSnapshot.dataSourceId)
          : persistenceState

      try {
        setGlobalConfigStatus('saving')
        if (nextStateBase !== persistenceState) {
          persistState(nextStateBase)
        }
        const nextGlobalState = await updateRadarGlobalConfig(normalizedConfig)
        setGlobalConfigState(nextGlobalState)
        setConfig(normalizedConfig)
        setSavedConfig(normalizedConfig)
        setSelectedTerm(targetSnapshot.selectedTerm ?? null)
        setSelectedHistoryEntryId(null)
        setGlobalConfigError(null)
        setGlobalConfigStatus('ready')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha ao restaurar o snapshot global.'
        setGlobalConfigError(message)
        setGlobalConfigStatus('error')
        toast.error(message)
      }
    },
    [globalConfigState.configSnapshots, persistState, persistenceState]
  )

  const deleteConfigSnapshot = useCallback(
    async (snapshotId: string) => {
      try {
        setGlobalConfigStatus('saving')
        const nextGlobalState = await deleteRadarGlobalConfigSnapshot(snapshotId)
        setGlobalConfigState(nextGlobalState)
        setGlobalConfigError(null)
        setGlobalConfigStatus('ready')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha ao apagar o snapshot global.'
        setGlobalConfigError(message)
        setGlobalConfigStatus('error')
        toast.error(message)
      }
    },
    []
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
      configSnapshots: globalConfigState.configSnapshots,
      currentConfig: config,
      dataSourceId: activeDataSource.id,
      currentHistoryEntryId: selectedHistoryEntryId,
    })
  }, [
    activeDataSource.id,
    config,
    globalConfigState.configSnapshots,
    persistenceState.searchHistory,
    rawData,
    selectedHistoryEntryId,
    selectedTerm,
  ])

  return {
    activeDataSource,
    config,
    configHistory,
    configSnapshots: globalConfigState.configSnapshots,
    dataSources: sortedDataSources,
    dateRange,
    globalConfigError,
    globalConfigStatus,
    importDataSource,
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
    deleteConfigSnapshot,
    restoreSearchHistoryEntry,
    saveConfig,
    updateConfig,
  }
}
