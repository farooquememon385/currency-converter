import { Controller, Get, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';

@Controller('api/currencies')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get()
  getCurrencies() {
    return this.currencyService.getCurrencies();
  }

  @Get('latest')
  getLatestRates(
    @Query('base') baseCurrency = 'USD',
    @Query('currencies') currencies?: string,
  ) {
    return this.currencyService.getLatestRates(baseCurrency, currencies);
  }
}
