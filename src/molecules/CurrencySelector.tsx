import { useTranslation } from 'react-i18next';

import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/lib/currency';

import { SegmentedToggle } from './SegmentedToggle';

export interface CurrencySelectorProps {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  testID?: string;
}

export function CurrencySelector({
  value,
  onChange,
  testID,
}: CurrencySelectorProps) {
  const { t } = useTranslation();
  return (
    <SegmentedToggle
      options={SUPPORTED_CURRENCIES.map((code) => ({
        value: code,
        label: t(`currency.${code}`),
      }))}
      value={value}
      onChange={(next) => onChange(next as CurrencyCode)}
      testID={testID}
    />
  );
}
