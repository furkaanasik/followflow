import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
import { categoryByKey } from '@/lib/categories';
import { CATEGORY_ICONS } from '@/lib/categoryIcons';
import { CHART_PALETTE } from '@/lib/color';
import { AlertBanner, FormFieldGroup, SegmentedToggle } from '@/molecules';
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useListCategoriesQuery,
  useUpdateCategoryMutation,
} from '@/store/api';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';

export function NewCategoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { key, type: typeParam } = useLocalSearchParams<{
    key?: string;
    type?: string;
  }>();
  const session = useAppSelector((s) => s.auth.session);

  const { data: rows = [] } = useListCategoriesQuery();
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation();
  const submitting = creating || updating || deleting;

  const builtin = key ? categoryByKey(key) : undefined;
  const overrideRow = builtin
    ? rows.find((r) => r.builtin_key === builtin.key)
    : undefined;
  const customRow =
    key && !builtin ? rows.find((r) => r.id === key) : undefined;
  const mode: 'create' | 'override' | 'edit' = builtin
    ? 'override'
    : customRow
      ? 'edit'
      : 'create';

  const [name, setName] = useState(() => {
    if (builtin) return overrideRow?.name ?? t(builtin.labelKey);
    return customRow?.name ?? '';
  });
  const [icon, setIcon] = useState<string>(() => {
    if (builtin) return overrideRow?.icon ?? builtin.icon;
    return customRow?.icon ?? CATEGORY_ICONS[0];
  });
  const [color, setColor] = useState<string | null>(() => {
    if (builtin) return overrideRow?.color ?? null;
    return customRow?.color ?? CHART_PALETTE[0];
  });
  const [type, setType] = useState<'income' | 'expense'>(() => {
    if (builtin) return builtin.type;
    if (customRow) return customRow.type;
    return typeParam === 'income' ? 'income' : 'expense';
  });
  const [hidden, setHidden] = useState(() => overrideRow?.hidden ?? false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  async function handleSave() {
    setNameError(undefined);
    setFormError(undefined);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(t('validation.categoryNameRequired'));
      return;
    }

    try {
      if (mode === 'override') {
        if (overrideRow) {
          await updateCategory({
            id: overrideRow.id,
            name: trimmedName,
            icon,
            color,
            hidden,
          }).unwrap();
        } else {
          await createCategory({
            user_id: session!.user.id,
            builtin_key: builtin!.key,
            type,
            name: trimmedName,
            icon,
            color,
            hidden,
          }).unwrap();
        }
      } else if (mode === 'edit') {
        await updateCategory({
          id: customRow!.id,
          name: trimmedName,
          icon,
          color,
        }).unwrap();
      } else {
        await createCategory({
          user_id: session!.user.id,
          builtin_key: null,
          type,
          name: trimmedName,
          icon,
          color: color ?? CHART_PALETTE[0],
        }).unwrap();
      }
    } catch {
      setFormError(t('newCategory.saveFailed'));
      return;
    }
    router.back();
  }

  function handleReset() {
    if (!overrideRow) {
      router.back();
      return;
    }
    setFormError(undefined);
    deleteCategory(overrideRow.id)
      .unwrap()
      .then(() => router.back())
      .catch(() => setFormError(t('newCategory.saveFailed')));
  }

  function confirmDelete() {
    if (!customRow) return;
    Alert.alert(t('newCategory.deleteTitle'), t('newCategory.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setFormError(undefined);
          deleteCategory(customRow.id)
            .unwrap()
            .then(() => router.back())
            .catch(() => setFormError(t('newCategory.saveFailed')));
        },
      },
    ]);
  }

  const label = (text: string) => (
    <Text
      style={{
        fontFamily: theme.fonts.body.semibold,
        fontSize: 12,
        color: theme.colors.textSecondary,
      }}
    >
      {text}
    </Text>
  );

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
              {mode === 'create'
                ? t('newCategory.title')
                : t('newCategory.editTitle')}
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
            label={t('newCategory.nameLabel')}
            value={name}
            onChangeText={(text) => {
              setNameError(undefined);
              setName(text);
            }}
            placeholder={t('newCategory.namePlaceholder')}
            icon="tag"
            error={nameError}
          />

          {mode === 'create' ? (
            <View style={{ gap: theme.spacing.xs }}>
              {label(t('newCategory.typeLabel'))}
              <SegmentedToggle
                options={[
                  { label: t('newTransaction.expense'), value: 'expense' },
                  { label: t('newTransaction.income'), value: 'income' },
                ]}
                value={type}
                onChange={(next) => setType(next as 'income' | 'expense')}
              />
            </View>
          ) : null}

          <View style={{ gap: theme.spacing.xs }}>
            {label(t('newCategory.iconLabel'))}
            <View style={styles.iconRow}>
              {CATEGORY_ICONS.map((ic) => (
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

          <View style={{ gap: theme.spacing.xs }}>
            {label(t('newCategory.colorLabel'))}
            <View style={styles.iconRow}>
              {CHART_PALETTE.map((hex) => (
                <Pressable
                  key={hex}
                  onPress={() => setColor(hex)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: hex === color }}
                  style={{
                    borderRadius: theme.radius.full,
                    borderWidth: 2,
                    padding: 2,
                    borderColor:
                      hex === color ? theme.colors.accentTeal : 'transparent',
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: theme.radius.full,
                      backgroundColor: hex,
                    }}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {mode === 'override' ? (
            <>
              <ButtonSecondary
                tone="accent"
                icon={hidden ? 'eye' : 'eye-off'}
                label={hidden ? t('newCategory.show') : t('newCategory.hide')}
                onPress={() => setHidden((h) => !h)}
              />
              <ButtonSecondary
                tone="destructive"
                icon="rotate-ccw"
                label={t('newCategory.resetDefault')}
                onPress={handleReset}
              />
            </>
          ) : null}

          {mode === 'edit' ? (
            <ButtonSecondary
              tone="destructive"
              icon="trash-2"
              label={t('newCategory.delete')}
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
            label={submitting ? t('newCategory.saving') : t('newCategory.save')}
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
});
