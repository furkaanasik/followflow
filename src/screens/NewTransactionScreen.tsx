import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { createElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AmountDisplay,
  ButtonIconOnly,
  ButtonPrimary,
  InputField,
} from '@/atoms';
import { getIcon } from '@/lib/icons';
import {
  AlertBanner,
  CategoryChip,
  NumpadKeyRow,
  SegmentedToggle,
} from '@/molecules';
import { categoriesByType, categoryByKey } from '@/lib/categories';
import { formatDate, parseAmount } from '@/lib/format';
import {
  useCreateTransactionMutation,
  useListTransactionsQuery,
  useUpdateTransactionMutation,
} from '@/store/api';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';

const NUMPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
];

function formatAmountInput(raw: string): string {
  if (!raw) return '₺0';
  const [intPart, decPart] = raw.split('.');
  const grouped = new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 0,
  }).format(Number(intPart || '0'));
  const dec = raw.includes('.') ? `,${decPart ?? ''}` : '';
  return `₺${grouped}${dec}`;
}

type TxnType = 'income' | 'expense';

export function NewTransactionScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const session = useAppSelector((s) => s.auth.session);
  const { data: transactions = [] } = useListTransactionsQuery();
  const [createTransaction, { isLoading: creating }] =
    useCreateTransactionMutation();
  const [updateTransaction, { isLoading: updating }] =
    useUpdateTransactionMutation();
  const submitting = creating || updating;

  // Edit mode: the list is already cached when arriving from a swipe action,
  // so the row is available at mount for the lazy state initializers below.
  const existing = id ? transactions.find((txn) => txn.id === id) : undefined;

  const [type, setType] = useState<TxnType>(() => existing?.type ?? 'expense');
  const [amountRaw, setAmountRaw] = useState(() =>
    existing ? String(existing.amount) : '',
  );
  const [categoryKey, setCategoryKey] = useState(() =>
    existing && categoryByKey(existing.category)
      ? existing.category
      : categoriesByType(existing?.type ?? 'expense')[0].key,
  );
  const [note, setNote] = useState(() => existing?.note ?? '');
  const [occurredAt, setOccurredAt] = useState(() =>
    existing ? new Date(existing.occurred_at) : new Date(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const categories = categoriesByType(type);

  const isToday = occurredAt.toDateString() === new Date().toDateString();
  const dateLabel = isToday
    ? t('newTransaction.today')
    : formatDate(occurredAt, {
        day: 'numeric',
        month: 'long',
        year:
          occurredAt.getFullYear() === new Date().getFullYear()
            ? undefined
            : 'numeric',
      });

  function handleDateChange(_event: DateTimePickerChangeEvent, date: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    setOccurredAt(date);
  }

  function handleTypeChange(next: string) {
    const nextType = next as TxnType;
    setType(nextType);
    setCategoryKey(categoriesByType(nextType)[0].key);
  }

  function handleKey(key: string) {
    setFieldError(undefined);
    setAmountRaw((prev) => {
      if (key === '⌫') return prev.slice(0, -1);
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev === '' ? '0.' : `${prev}.`;
      }
      // limit two decimals and overall length
      if (prev.includes('.')) {
        const [, dec] = prev.split('.');
        if (dec.length >= 2) return prev;
      }
      if (prev.length >= 12) return prev;
      if (prev === '0') return key; // avoid leading zero
      return prev + key;
    });
  }

  async function handleSave() {
    setFieldError(undefined);
    setFormError(undefined);

    const amount = parseAmount(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFieldError(t('validation.amountRequired'));
      return;
    }
    const category = categoryByKey(categoryKey);
    if (!category) {
      setFieldError(t('validation.categoryRequired'));
      return;
    }

    const trimmedNote = note.trim();
    const payload = {
      type,
      category: category.key,
      icon: category.icon,
      title: trimmedNote || t(category.labelKey),
      note: trimmedNote || null,
      amount,
      occurred_at: occurredAt.toISOString(),
    };
    try {
      if (existing) {
        await updateTransaction({ id: existing.id, ...payload }).unwrap();
      } else {
        await createTransaction({
          user_id: session!.user.id,
          ...payload,
        }).unwrap();
      }
    } catch {
      setFormError(t('newTransaction.saveFailed'));
      return;
    }
    router.back();
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.bgSurface }]}
    >
      <View style={[styles.content, { gap: 10 }]}>
        <View style={styles.header}>
          <Text
            style={{
              fontFamily: theme.fonts.heading.bold,
              fontSize: 20,
              color: theme.colors.textPrimary,
            }}
          >
            {existing
              ? t('newTransaction.editTitle')
              : t('newTransaction.title')}
          </Text>
          <ButtonIconOnly
            icon="x"
            variant="surface"
            size={40}
            accessibilityLabel={t('newTransaction.close')}
            onPress={() => router.back()}
          />
        </View>

        {formError ? <AlertBanner message={formError} /> : null}

        <SegmentedToggle
          options={[
            { label: t('newTransaction.expense'), value: 'expense' },
            { label: t('newTransaction.income'), value: 'income' },
          ]}
          value={type}
          onChange={handleTypeChange}
        />

        <View style={styles.amountArea}>
          <AmountDisplay
            amount={formatAmountInput(amountRaw)}
            tone={type === 'income' ? 'income' : 'expense'}
          />
          {fieldError ? (
            <Text
              style={{
                fontFamily: theme.fonts.body.medium,
                fontSize: 12,
                color: theme.colors.warningRed,
                textAlign: 'center',
              }}
            >
              {fieldError}
            </Text>
          ) : null}
        </View>

        <View style={styles.chips}>
          {categories.map((cat) => (
            <CategoryChip
              key={cat.key}
              icon={cat.icon}
              label={t(cat.labelKey)}
              tint={cat.tint}
              selected={cat.key === categoryKey}
              onPress={() => setCategoryKey(cat.key)}
            />
          ))}
        </View>

        <Pressable
          onPress={() => setShowDatePicker((open) => !open)}
          accessibilityRole="button"
          accessibilityLabel={t('newTransaction.dateLabel')}
          style={[
            styles.dateRow,
            {
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.bgSurfaceAlt,
            },
          ]}
        >
          {createElement(getIcon('calendar'), {
            size: 16,
            color: theme.colors.textTertiary,
          })}
          <Text
            style={{
              flex: 1,
              fontFamily: theme.fonts.body.medium,
              fontSize: 14,
              color: theme.colors.textPrimary,
            }}
          >
            {dateLabel}
          </Text>
          {createElement(getIcon('chevron-right'), {
            size: 18,
            color: theme.colors.textTertiary,
          })}
        </Pressable>

        {showDatePicker ? (
          <DateTimePicker
            value={occurredAt}
            mode="date"
            maximumDate={new Date()}
            onValueChange={handleDateChange}
            onDismiss={() => setShowDatePicker(false)}
          />
        ) : null}

        <InputField
          value={note}
          onChangeText={setNote}
          placeholder={t('newTransaction.notePlaceholder')}
          icon="pencil"
        />
      </View>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <View style={styles.numpad}>
          {NUMPAD_ROWS.map((row) => (
            <NumpadKeyRow
              key={row.join('')}
              keys={row}
              onKeyPress={handleKey}
            />
          ))}
        </View>
        <ButtonPrimary
          label={
            submitting ? t('newTransaction.saving') : t('newTransaction.save')
          }
          onPress={handleSave}
          disabled={submitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountArea: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  numpad: { gap: 2, alignSelf: 'center', width: 280 },
});
