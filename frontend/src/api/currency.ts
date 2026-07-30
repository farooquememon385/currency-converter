export interface Currency {
  code: string
  name: string
  symbol: string
  type: string
}

interface CurrenciesResponse {
  data: Record<string, Currency>
}

interface LatestRatesResponse {
  data: Record<string, number>
}

interface HistoricalRatesResponse {
  data: Record<string, Record<string, number>>
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal })

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : 'Unable to reach the currency service.'

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function getCurrencies(
  signal?: AbortSignal,
): Promise<Currency[]> {
  const response = await request<CurrenciesResponse>('/api/currencies', signal)

  return Object.values(response.data).sort((first, second) =>
    first.code.localeCompare(second.code),
  )
}

export async function getLatestRate(
  baseCurrency: string,
  targetCurrency: string,
): Promise<number> {
  const query = new URLSearchParams({
    base: baseCurrency,
    currencies: targetCurrency,
  })
  const response = await request<LatestRatesResponse>(
    `/api/currencies/latest?${query.toString()}`,
  )
  const rate = response.data[targetCurrency]

  if (typeof rate !== 'number') {
    throw new Error('The selected exchange rate is unavailable.')
  }

  return rate
}

export async function getHistoricalRate(
  date: string,
  baseCurrency: string,
  targetCurrency: string,
): Promise<number> {
  const query = new URLSearchParams({
    date,
    base: baseCurrency,
    currencies: targetCurrency,
  })
  const response = await request<HistoricalRatesResponse>(
    `/api/currencies/historical?${query.toString()}`,
  )
  const rate = response.data[date]?.[targetCurrency]

  if (typeof rate !== 'number') {
    throw new Error('The exchange rate is unavailable for the selected date.')
  }

  return rate
}
