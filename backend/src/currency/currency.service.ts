import {
  BadRequestException,
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
  CurrenciesResponse,
  HistoricalRatesResponse,
  LatestRatesResponse,
} from './currency.types';

const CURRENCIES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LATEST_RATE_CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CurrencyService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private currenciesCache?: CacheEntry<CurrenciesResponse>;
  private readonly latestRateCache = new Map<string, CacheEntry<number>>();
  private readonly allLatestRatesCache = new Map<
    string,
    CacheEntry<LatestRatesResponse>
  >();

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.apiKey = configService.get<string>('FREE_CURRENCY_API_KEY') ?? '';
    this.baseUrl =
      configService.get<string>('FREE_CURRENCY_BASE_URL') ??
      'https://api.freecurrencyapi.com/v1';
  }

  async getCurrencies(): Promise<CurrenciesResponse> {
    const cachedCurrencies = this.getCached(this.currenciesCache);

    if (cachedCurrencies) {
      return cachedCurrencies;
    }

    const currencies = await this.get<CurrenciesResponse>('/currencies');
    this.currenciesCache = this.createCacheEntry(
      currencies,
      CURRENCIES_CACHE_TTL_MS,
    );

    return currencies;
  }

  async getLatestRates(
    baseCurrency = 'USD',
    currencies?: string,
  ): Promise<LatestRatesResponse> {
    const normalizedBase = this.normalizeCurrency(baseCurrency);

    if (!currencies) {
      return this.getAllLatestRates(normalizedBase);
    }

    const targetCurrencies = [
      ...new Set(
        currencies
          .split(',')
          .map((currency) => this.normalizeCurrency(currency)),
      ),
    ];
    const rates: Record<string, number> = {};
    const missingCurrencies: string[] = [];

    for (const targetCurrency of targetCurrencies) {
      const cachedRate = this.getCached(
        this.latestRateCache.get(
          this.latestRateCacheKey(normalizedBase, targetCurrency),
        ),
      );

      if (cachedRate === undefined) {
        missingCurrencies.push(targetCurrency);
      } else {
        rates[targetCurrency] = cachedRate;
      }
    }

    if (missingCurrencies.length > 0) {
      const response = await this.get<LatestRatesResponse>('/latest', {
        base_currency: normalizedBase,
        currencies: missingCurrencies.join(','),
      });

      for (const [targetCurrency, rate] of Object.entries(response.data)) {
        this.latestRateCache.set(
          this.latestRateCacheKey(normalizedBase, targetCurrency),
          this.createCacheEntry(rate, LATEST_RATE_CACHE_TTL_MS),
        );
        rates[targetCurrency] = rate;
      }
    }

    return {
      data: Object.fromEntries(
        targetCurrencies
          .filter((currency) => rates[currency] !== undefined)
          .map((currency) => [currency, rates[currency]]),
      ),
    };
  }

  private async getAllLatestRates(
    baseCurrency: string,
  ): Promise<LatestRatesResponse> {
    const cachedRates = this.getCached(
      this.allLatestRatesCache.get(baseCurrency),
    );

    if (cachedRates) {
      return cachedRates;
    }

    const params: Record<string, string> = {
      base_currency: baseCurrency,
    };
    const response = await this.get<LatestRatesResponse>('/latest', params);

    this.allLatestRatesCache.set(
      baseCurrency,
      this.createCacheEntry(response, LATEST_RATE_CACHE_TTL_MS),
    );

    for (const [targetCurrency, rate] of Object.entries(response.data)) {
      this.latestRateCache.set(
        this.latestRateCacheKey(baseCurrency, targetCurrency),
        this.createCacheEntry(rate, LATEST_RATE_CACHE_TTL_MS),
      );
    }

    return response;
  }

  async getHistoricalRates(
    date: string,
    baseCurrency = 'USD',
    currencies?: string,
  ): Promise<HistoricalRatesResponse> {
    const params: Record<string, string> = {
      date: this.normalizeDate(date),
      base_currency: this.normalizeCurrency(baseCurrency),
    };

    if (currencies) {
      params.currencies = currencies
        .split(',')
        .map((currency) => this.normalizeCurrency(currency))
        .join(',');
    }

    return this.get<HistoricalRatesResponse>('/historical', params);
  }

  private normalizeDate(date: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Date must use YYYY-MM-DD format');
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    const today = new Date().toISOString().slice(0, 10);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException('Date is invalid');
    }

    if (date >= today) {
      throw new BadRequestException('Historical date must be before today');
    }

    return date;
  }

  private normalizeCurrency(currency: string): string {
    const normalized = currency.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new BadRequestException(`Invalid currency code: ${currency}`);
    }

    return normalized;
  }

  private latestRateCacheKey(
    baseCurrency: string,
    targetCurrency: string,
  ): string {
    return `${baseCurrency}:${targetCurrency}`;
  }

  private createCacheEntry<T>(value: T, ttl: number): CacheEntry<T> {
    return {
      value,
      expiresAt: Date.now() + ttl,
    };
  }

  private getCached<T>(entry?: CacheEntry<T>): T | undefined {
    if (!entry || entry.expiresAt <= Date.now()) {
      return undefined;
    }

    return entry.value;
  }

  private async get<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    if (!this.apiKey || this.apiKey === 'your_api_key') {
      throw new ServiceUnavailableException(
        'Currency API key is not configured',
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(`${this.baseUrl}${path}`, {
          headers: { apikey: this.apiKey },
          params,
        }),
      );

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response) {
        throw new BadGatewayException(
          error.response.data ?? 'Currency provider request failed',
        );
      }

      throw new ServiceUnavailableException('Currency provider is unavailable');
    }
  }
}
