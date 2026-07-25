import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ButtonSecondary, InputField, SurfaceCard } from '@/atoms';
import {
  activeFilterCount,
  type TransactionFilters,
} from '@/lib/filterTransactions';
import { parseAmount } from '@/lib/format';
import { useCategories } from '@/lib/useCategories';
import { CategoryChip, DateField } from '@/molecules';
import { useTheme } from '@/theme';

export interface TransactionFilterPanelProps {
  filters: TransactionFilters;
  onChange: (next: TransactionFilters) => void;
  onClear: () => void;
}

export function TransactionFilterPanel({
  filters,
  onChange,
  onClear,
}: TransactionFilterPanelProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { all } = useCategories();
  const categories = all.filter((c) => !c.hidden);

  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [minText, setMinText] = useState(
    filters.minAmount !== null ? String(filters.minAmount) : '',
  );
  const [maxText, setMaxText] = useState(
    filters.maxAmount !== null ? String(filters.maxAmount) : '',
  );

  // Display the local text while it parses to the current filter value
  // (preserves in-progress typing like "1,"); fall back to the filter value
  // when it changed from outside (e.g. a clear) so the inputs never go stale.
  const displayAmount = (text: string, filterValue: number | null) => {
    const parsed = parseAmount(text);
    const current = Number.isNaN(parsed) ? null : parsed;
    if (current === filterValue) return text;
    return filterValue === null ? '' : String(filterValue);
  };
  const minValue = displayAmount(minText, filters.minAmount);
  const maxValue = displayAmount(maxText, filters.maxAmount);

  const labelStyle = {
    fontFamily: theme.fonts.body.semibold,
    fontSize: 12,
    color: theme.colors.textSecondary,
  } as const;

  function handleFromChange(_event: DateTimePickerChangeEvent, date: Date) {
    if (Platform.OS === 'android') setShowFrom(false);
    onChange({ ...filters, from: date.toISOString() });
  }

  function handleToChange(_event: DateTimePickerChangeEvent, date: Date) {
    if (Platform.OS === 'android') setShowTo(false);
    onChange({ ...filters, to: date.toISOString() });
  }

  function toggleCategory(key: string) {
    const categoryKeys = filters.categoryKeys.includes(key)
      ? filters.categoryKeys.filter((k) => k !== key)
      : [...filters.categoryKeys, key];
    onChange({ ...filters, categoryKeys });
  }

  function handleMinChange(text: string) {
    setMinText(text);
    const parsed = parseAmount(text);
    onChange({ ...filters, minAmount: Number.isNaN(parsed) ? null : parsed });
  }

  function handleMaxChange(text: string) {
    setMaxText(text);
    const parsed = parseAmount(text);
    onChange({ ...filters, maxAmount: Number.isNaN(parsed) ? null : parsed });
  }

  function handleClear() {
    // Effects above only react to filter *value* changes; junk text that
    // never parsed (minAmount already null) must be wiped explicitly.
    setMinText('');
    setMaxText('');
    setShowFrom(false);
    setShowTo(false);
    onClear();
  }

  return (
    <SurfaceCard>
      <View style={{ gap: theme.spacing.xs }}>
        <Text style={labelStyle}>{t('transactions.filterDate')}</Text>
        <View style={[styles.row, { gap: theme.spacing.sm }]}>
          <DateField
            value={filters.from}
            placeholder={t('transactions.filterDateFrom')}
            onPress={() => setShowFrom((v) => !v)}
          />
          <DateField
            value={filters.to}
            placeholder={t('transactions.filterDateTo')}
            onPress={() => setShowTo((v) => !v)}
          />
        </View>
        {showFrom ? (
          <DateTimePicker
            value={filters.from ? new Date(filters.from) : new Date()}
            mode="date"
            onValueChange={handleFromChange}
            onDismiss={() => setShowFrom(false)}
          />
        ) : null}
        {showTo ? (
          <DateTimePicker
            value={filters.to ? new Date(filters.to) : new Date()}
            mode="date"
            onValueChange={handleToChange}
            onDismiss={() => setShowTo(false)}
          />
        ) : null}
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Text style={labelStyle}>{t('transactions.filterCategory')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing.xs }}
        >
          {categories.map((cat) => (
            <CategoryChip
              key={cat.key}
              icon={cat.icon}
              label={cat.label}
              tint={cat.tint}
              color={cat.color}
              selected={filters.categoryKeys.includes(cat.key)}
              onPress={() => toggleCategory(cat.key)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Text style={labelStyle}>{t('transactions.filterAmount')}</Text>
        <View style={[styles.row, { gap: theme.spacing.sm }]}>
          <View style={styles.amountField}>
            <InputField
              value={minValue}
              onChangeText={handleMinChange}
              placeholder={t('transactions.filterAmountMin')}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.amountField}>
            <InputField
              value={maxValue}
              onChangeText={handleMaxChange}
              placeholder={t('transactions.filterAmountMax')}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {activeFilterCount(filters) > 0 ? (
        <ButtonSecondary
          label={t('transactions.filterClear')}
          onPress={handleClear}
        />
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  amountField: { flex: 1 },
});
