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

@Injectable()
export class CurrencyService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

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
    return this.get<CurrenciesResponse>('/currencies');
  }

  async getLatestRates(
    baseCurrency = 'USD',
    currencies?: string,
  ): Promise<LatestRatesResponse> {
    const params: Record<string, string> = {
      base_currency: this.normalizeCurrency(baseCurrency),
    };

    if (currencies) {
      params.currencies = currencies
        .split(',')
        .map((currency) => this.normalizeCurrency(currency))
        .join(',');
    }

    return this.get<LatestRatesResponse>('/latest', params);
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
