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
import { CurrenciesResponse, LatestRatesResponse } from './currency.types';

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
