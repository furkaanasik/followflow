import {
  convert,
  SUPPORTED_CURRENCIES,
  toCurrencyCode,
  type CurrencyCode,
  type RatesTable,
} from './currency';

export interface SignedAmount {
  amount: number;
  currency: string;
  sign: 1 | -1;
}

export interface Holding {
  currency: CurrencyCode;
  total: number;
}

// Per-unit balances in SUPPORTED_CURRENCIES order; zero-balance units are
// dropped unless every holding is zero (then TRY 0 remains as anchor).
export function holdingsByCurrency(rows: SignedAmount[]): Holding[] {
  const totals = new Map<CurrencyCode, number>();
  for (const row of rows) {
    // Unknown values bucket into TRY instead of silently vanishing from
    // the SUPPORTED_CURRENCIES filter below — money must never disappear.
    const currency = toCurrencyCode(row.currency);
    totals.set(currency, (totals.get(currency) ?? 0) + row.sign * row.amount);
  }
  const holdings = SUPPORTED_CURRENCIES.filter(
    (c) => (totals.get(c) ?? 0) !== 0,
  ).map((c) => ({ currency: c, total: totals.get(c)! }));
  return holdings.length ? holdings : [{ currency: 'TRY', total: 0 }];
}

export interface MainCurrencyTotal {
  total: number;
  excluded: CurrencyCode[]; // holdings without a usable rate (e.g. gold)
}

export function totalInMainCurrency(
  holdings: Holding[],
  main: CurrencyCode,
  rates: RatesTable | null,
): MainCurrencyTotal {
  let total = 0;
  const excluded: CurrencyCode[] = [];
  for (const holding of holdings) {
    const value = rates
      ? convert(holding.total, holding.currency, main, rates)
      : holding.currency === main
        ? holding.total
        : null;
    if (value == null) excluded.push(holding.currency);
    else total += value;
  }
  return { total, excluded };
}
