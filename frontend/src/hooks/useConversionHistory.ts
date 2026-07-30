import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'currency-converter:history'
const HISTORY_LIMIT = 50

export interface ConversionHistoryEntry {
  id: string
  amount: number
  convertedAmount: number
  from: string
  rate: number
  to: string
  createdAt: string
}

export type NewConversionHistoryEntry = Omit<
  ConversionHistoryEntry,
  'id' | 'createdAt'
>

function isHistoryEntry(value: unknown): value is ConversionHistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const entry = value as Record<string, unknown>

  return (
    typeof entry.id === 'string' &&
    typeof entry.amount === 'number' &&
    typeof entry.convertedAmount === 'number' &&
    typeof entry.from === 'string' &&
    typeof entry.rate === 'number' &&
    typeof entry.to === 'string' &&
    typeof entry.createdAt === 'string'
  )
}

function loadHistory(): ConversionHistoryEntry[] {
  try {
    const storedHistory = localStorage.getItem(STORAGE_KEY)

    if (!storedHistory) {
      return []
    }

    const parsedHistory: unknown = JSON.parse(storedHistory)

    return Array.isArray(parsedHistory)
      ? parsedHistory.filter(isHistoryEntry).slice(0, HISTORY_LIMIT)
      : []
  } catch {
    return []
  }
}

export function useConversionHistory() {
  const [history, setHistory] =
    useState<ConversionHistoryEntry[]>(loadHistory)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch {
      // Conversion should still work when storage is unavailable.
    }
  }, [history])

  const addConversion = useCallback((conversion: NewConversionHistoryEntry) => {
    const entry: ConversionHistoryEntry = {
      ...conversion,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    setHistory((currentHistory) =>
      [entry, ...currentHistory].slice(0, HISTORY_LIMIT),
    )
  }, [])

  const clearHistory = useCallback(() => setHistory([]), [])

  return { history, addConversion, clearHistory }
}
