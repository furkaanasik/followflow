import {
  GRAMS_PER_TROY_OUNCE,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
  type RatesTable,
} from '@/lib/currency';
import { supabase } from '@/lib/supabase';

import { api, toApiError } from './baseApi';

const FX_URL = 'https://open.er-api.com/v6/latest/TRY';
// Best-effort gold source; currently requires a key on most endpoints, so
// failure is expected and GAU simply stays absent (UI degrades gracefully).
const GOLD_URL = 'https://api.exchangerate.host/latest?base=TRY&symbols=XAU';

const isoToday = () => new Date().toISOString().slice(0, 10);

// A hanging FX host must never stall getRates (warmed at app root); a slow
// fetch aborts and the query falls back to the fx_rates snapshot instead.
const FETCH_TIMEOUT_MS = 10_000;

// er-api returns quote-per-base (USD per 1 TRY); RatesTable stores the value
// of 1 unit in TRY, so invert.
async function fetchExternalRates(): Promise<
  Partial<Record<CurrencyCode, number>>
> {
  const res = await fetch(FX_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`);
  const json = (await res.json()) as {
    result: string;
    rates?: Record<string, number>;
  };
  if (json.result !== 'success' || !json.rates)
    throw new Error('FX fetch failed: bad payload');

  const out: Partial<Record<CurrencyCode, number>> = {};
  if (json.rates.USD > 0) out.USD = 1 / json.rates.USD;
  if (json.rates.EUR > 0) out.EUR = 1 / json.rates.EUR;
  if (json.rates.XAU > 0) out.GAU = 1 / json.rates.XAU / GRAMS_PER_TROY_OUNCE;

  if (out.GAU == null) {
    try {
      const goldRes = await fetch(GOLD_URL, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (goldRes.ok) {
        const gold = (await goldRes.json()) as {
          success?: boolean;
          rates?: { XAU?: number };
        };
        const xauPerTry = gold.rates?.XAU;
        if (gold.success !== false && xauPerTry && xauPerTry > 0) {
          out.GAU = 1 / xauPerTry / GRAMS_PER_TROY_OUNCE;
        }
      }
    } catch {
      // Gold stays absent — callers exclude GAU from totals and surface a note.
    }
  }
  return out;
}

async function snapshotRates(rates: Partial<Record<CurrencyCode, number>>) {
  const asOf = isoToday();
  const rows = (Object.entries(rates) as [CurrencyCode, number][])
    .filter(([quote]) => quote !== 'TRY')
    .map(([quote, rate]) => ({ quote, rate, as_of: asOf }));
  if (!rows.length) return;
  await supabase.from('fx_rates').upsert(rows, { onConflict: 'quote,as_of' });
}

async function cachedRates(): Promise<RatesTable | null> {
  const { data, error } = await supabase
    .from('fx_rates')
    .select('quote, rate, as_of')
    .order('as_of', { ascending: false })
    .limit(30);
  if (error || !data?.length) return null;
  const rates: Partial<Record<CurrencyCode, number>> = {};
  let asOf = '';
  for (const row of data) {
    // Shared table — skip any row whose quote isn't a supported currency.
    if (!SUPPORTED_CURRENCIES.includes(row.quote as CurrencyCode)) continue;
    const quote = row.quote as CurrencyCode;
    if (rates[quote] == null) {
      rates[quote] = Number(row.rate);
      if (row.as_of > asOf) asOf = row.as_of;
    }
  }
  return { base: 'TRY', rates, asOf };
}

export interface RatesResult extends RatesTable {
  stale: boolean; // true when served from cache after a failed live fetch
}

export const fxApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRates: builder.query<RatesResult, void>({
      queryFn: async () => {
        try {
          const rates = await fetchExternalRates();
          await snapshotRates(rates).catch(() => {});
          return {
            data: {
              base: 'TRY' as const,
              rates,
              asOf: isoToday(),
              stale: false,
            },
          };
        } catch (fetchError) {
          const cached = await cachedRates();
          if (cached) return { data: { ...cached, stale: true } };
          return {
            error: toApiError({
              code: 'FX_UNAVAILABLE',
              message:
                fetchError instanceof Error
                  ? fetchError.message
                  : 'FX rates unavailable',
            }),
          };
        }
      },
      providesTags: ['FxRate'],
    }),
  }),
});

export const { useGetRatesQuery } = fxApi;

export interface UseRates {
  rates: RatesTable | null;
  stale: boolean;
}

export function useRates(): UseRates {
  const { data } = useGetRatesQuery();
  return { rates: data ?? null, stale: data?.stale ?? false };
}
