export interface Currency {
  symbol: string;
  name: string;
  symbol_native: string;
  decimal_digits: number;
  rounding: number;
  code: string;
  name_plural: string;
  type: string;
}

export interface CurrenciesResponse {
  data: Record<string, Currency>;
}

export interface LatestRatesResponse {
  data: Record<string, number>;
}

export interface HistoricalRatesResponse {
  data: Record<string, Record<string, number>>;
}
