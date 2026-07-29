import { BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  const httpService = {
    get: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        FREE_CURRENCY_API_KEY: 'test-key',
        FREE_CURRENCY_BASE_URL: 'https://currency.test/v1',
      };

      return config[key];
    }),
  };
  let service: CurrencyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CurrencyService(
      httpService as unknown as HttpService,
      configService as unknown as ConfigService,
    );
  });

  it('requests supported currencies without exposing the API key in the URL', async () => {
    const response = {
      data: {
        data: {
          USD: {
            symbol: '$',
            name: 'US Dollar',
            symbol_native: '$',
            decimal_digits: 2,
            rounding: 0,
            code: 'USD',
            name_plural: 'US dollars',
            type: 'fiat',
          },
        },
      },
    };
    httpService.get.mockReturnValue(of(response));

    await expect(service.getCurrencies()).resolves.toEqual(response.data);
    expect(httpService.get).toHaveBeenCalledWith(
      'https://currency.test/v1/currencies',
      {
        headers: { apikey: 'test-key' },
        params: {},
      },
    );
  });

  it('normalizes latest-rate query parameters', async () => {
    httpService.get.mockReturnValue(of({ data: { data: { EUR: 0.85 } } }));

    await service.getLatestRates(' usd ', 'eur, gbp');

    expect(httpService.get).toHaveBeenCalledWith(
      'https://currency.test/v1/latest',
      {
        headers: { apikey: 'test-key' },
        params: {
          base_currency: 'USD',
          currencies: 'EUR,GBP',
        },
      },
    );
  });

  it('rejects invalid currency codes before requesting the provider', async () => {
    await expect(service.getLatestRates('US')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(httpService.get).not.toHaveBeenCalled();
  });
});
