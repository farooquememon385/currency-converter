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
    await expect(service.getCurrencies()).resolves.toEqual(response.data);
    expect(httpService.get).toHaveBeenCalledWith(
      'https://currency.test/v1/currencies',
      {
        headers: { apikey: 'test-key' },
        params: {},
      },
    );
    expect(httpService.get).toHaveBeenCalledTimes(1);
  });

  it('normalizes and caches latest unit rates by currency pair', async () => {
    const response = { data: { data: { EUR: 0.85, GBP: 0.75 } } };
    httpService.get.mockReturnValue(of(response));

    await expect(service.getLatestRates(' usd ', 'eur, gbp')).resolves.toEqual(
      response.data,
    );
    await expect(service.getLatestRates('USD', 'EUR,GBP')).resolves.toEqual(
      response.data,
    );

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
    expect(httpService.get).toHaveBeenCalledTimes(1);
  });

  it('only requests unit rates missing from the cache', async () => {
    httpService.get
      .mockReturnValueOnce(of({ data: { data: { EUR: 0.85 } } }))
      .mockReturnValueOnce(of({ data: { data: { GBP: 0.75 } } }));

    await service.getLatestRates('USD', 'EUR');
    await expect(service.getLatestRates('USD', 'EUR,GBP')).resolves.toEqual({
      data: { EUR: 0.85, GBP: 0.75 },
    });

    expect(httpService.get).toHaveBeenLastCalledWith(
      'https://currency.test/v1/latest',
      {
        headers: { apikey: 'test-key' },
        params: {
          base_currency: 'USD',
          currencies: 'GBP',
        },
      },
    );
    expect(httpService.get).toHaveBeenCalledTimes(2);
  });

  it('requests historical rates for a valid date', async () => {
    httpService.get.mockReturnValue(
      of({ data: { data: { '2024-01-15': { EUR: 0.91 } } } }),
    );

    await service.getHistoricalRates('2024-01-15', 'usd', 'eur');

    expect(httpService.get).toHaveBeenCalledWith(
      'https://currency.test/v1/historical',
      {
        headers: { apikey: 'test-key' },
        params: {
          date: '2024-01-15',
          base_currency: 'USD',
          currencies: 'EUR',
        },
      },
    );
  });

  it('rejects invalid and future historical dates', async () => {
    await expect(
      service.getHistoricalRates('2024-02-31'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.getHistoricalRates('2999-01-01'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(httpService.get).not.toHaveBeenCalled();
  });

  it('rejects invalid currency codes before requesting the provider', async () => {
    await expect(service.getLatestRates('US')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(httpService.get).not.toHaveBeenCalled();
  });
});
