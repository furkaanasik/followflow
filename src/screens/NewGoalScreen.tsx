import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ButtonIconOnly,
  ButtonPrimary,
  ButtonSecondary,
  CategoryIcon,
} from '@/atoms';
import { formatDate, parseAmount } from '@/lib/format';
import { getIcon } from '@/lib/icons';
import { GOAL_ICONS } from '@/lib/goalIcons';
import { AlertBanner, FormFieldGroup } from '@/molecules';
import {
  useCreateGoalMutation,
  useDeleteGoalMutation,
  useListGoalsQuery,
  useUpdateGoalMutation,
} from '@/store/api';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';

export function NewGoalScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const session = useAppSelector((s) => s.auth.session);

  const { data: goals = [] } = useListGoalsQuery();
  const [createGoal, { isLoading: creating }] = useCreateGoalMutation();
  const [updateGoal, { isLoading: updating }] = useUpdateGoalMutation();
  const [deleteGoal, { isLoading: deleting }] = useDeleteGoalMutation();
  const submitting = creating || updating || deleting;

  const existing = id ? goals.find((g) => g.id === id) : undefined;

  const [name, setName] = useState(() => existing?.name ?? '');
  const [icon, setIcon] = useState(() => existing?.icon ?? GOAL_ICONS[0]);
  const [targetRaw, setTargetRaw] = useState(() =>
    existing ? String(existing.target_amount) : '',
  );
  const [savedRaw, setSavedRaw] = useState(() =>
    existing ? String(existing.current_amount) : '',
  );
  const [targetDate, setTargetDate] = useState<Date | null>(() =>
    existing?.target_date ? new Date(existing.target_date) : null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [targetError, setTargetError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  function handleDateChange(_event: DateTimePickerChangeEvent, date: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    setTargetDate(date);
  }

  async function handleSave() {
    setNameError(undefined);
    setTargetError(undefined);
    setFormError(undefined);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(t('validation.goalNameRequired'));
      return;
    }
    const target = parseAmount(targetRaw);
    if (!Number.isFinite(target) || target <= 0) {
      setTargetError(t('validation.amountRequired'));
      return;
    }
    const payload = {
      icon,
      name: trimmedName,
      target_amount: target,
      target_date: targetDate ? targetDate.toISOString().slice(0, 10) : null,
    };
    try {
      if (existing) {
        // current_amount is intentionally left out on edit — the balance is
        // managed by the deposit/remove-contribution flows, not this form.
        await updateGoal({ id: existing.id, ...payload }).unwrap();
      } else {
        const saved = savedRaw.trim() ? parseAmount(savedRaw) : 0;
        if (!Number.isFinite(saved) || saved < 0) {
          setTargetError(t('validation.amountInvalid'));
          return;
        }
        await createGoal({
          user_id: session!.user.id,
          current_amount: saved,
          ...payload,
        }).unwrap();
      }
    } catch {
      setFormError(t('newGoal.saveFailed'));
      return;
    }
    router.back();
  }

  function confirmDelete() {
    if (!existing) return;
    Alert.alert(t('newGoal.deleteTitle'), t('newGoal.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setFormError(undefined);
          deleteGoal(existing.id)
            .unwrap()
            .then(() => router.back())
            .catch(() => setFormError(t('newGoal.saveFailed')));
        },
      },
    ]);
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.bgSurface }]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { gap: theme.spacing.md }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text
              style={{
                fontFamily: theme.fonts.heading.bold,
                fontSize: 20,
                color: theme.colors.textPrimary,
              }}
            >
              {existing ? t('newGoal.editTitle') : t('newGoal.title')}
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

          <FormFieldGroup
            label={t('newGoal.nameLabel')}
            value={name}
            onChangeText={(text) => {
              setNameError(undefined);
              setName(text);
            }}
            placeholder={t('newGoal.namePlaceholder')}
            icon="target"
            error={nameError}
          />

          <View style={{ gap: theme.spacing.xs }}>
            <Text
              style={{
                fontFamily: theme.fonts.body.semibold,
                fontSize: 12,
                color: theme.colors.textSecondary,
              }}
            >
              {t('newGoal.iconLabel')}
            </Text>
            <View style={styles.iconRow}>
              {GOAL_ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ic === icon }}
                  style={{
                    borderRadius: theme.radius.full,
                    borderWidth: 2,
                    borderColor:
                      ic === icon ? theme.colors.accentTeal : 'transparent',
                  }}
                >
                  <CategoryIcon
                    icon={ic}
                    size={40}
                    tint={ic === icon ? 'accentTeal' : 'textSecondary'}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <FormFieldGroup
            label={t('newGoal.targetLabel')}
            value={targetRaw}
            onChangeText={(text) => {
              setTargetError(undefined);
              setTargetRaw(text);
            }}
            placeholder={t('onboarding.amountPlaceholder')}
            icon="banknote"
            keyboardType="decimal-pad"
            error={targetError}
          />

          {!existing ? (
            <FormFieldGroup
              label={t('newGoal.savedLabel')}
              value={savedRaw}
              onChangeText={setSavedRaw}
              placeholder={t('onboarding.amountPlaceholder')}
              icon="piggy-bank"
              keyboardType="decimal-pad"
            />
          ) : null}

          <View style={{ gap: theme.spacing.xs }}>
            <Text
              style={{
                fontFamily: theme.fonts.body.semibold,
                fontSize: 12,
                color: theme.colors.textSecondary,
              }}
            >
              {t('newGoal.dateLabel')}
            </Text>
            <Pressable
              onPress={() => setShowDatePicker((open) => !open)}
              accessibilityRole="button"
              accessibilityLabel={t('newGoal.dateLabel')}
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
                  color: targetDate
                    ? theme.colors.textPrimary
                    : theme.colors.textTertiary,
                }}
              >
                {targetDate
                  ? formatDate(targetDate, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : t('newGoal.datePlaceholder')}
              </Text>
              {createElement(getIcon('chevron-right'), {
                size: 18,
                color: theme.colors.textTertiary,
              })}
            </Pressable>
          </View>

          {showDatePicker ? (
            <DateTimePicker
              value={targetDate ?? new Date()}
              mode="date"
              minimumDate={new Date()}
              onValueChange={handleDateChange}
              onDismiss={() => setShowDatePicker(false)}
            />
          ) : null}

          {existing ? (
            <ButtonSecondary
              tone="destructive"
              icon="trash-2"
              label={t('newGoal.delete')}
              onPress={confirmDelete}
            />
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <ButtonPrimary
            label={submitting ? t('newGoal.saving') : t('newGoal.save')}
            onPress={handleSave}
            disabled={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  footer: { paddingHorizontal: 24, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconRow: {
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
});
