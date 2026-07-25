import { useFocusEffect, useRouter } from 'expo-router';
import { createElement, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButtonSecondary, CategoryIcon } from '@/atoms';
import { getIcon } from '@/lib/icons';
import { useCategories } from '@/lib/useCategories';
import { SegmentedToggle } from '@/molecules';
import { AppBarBackTitle } from '@/organisms';
import { useTheme } from '@/theme';

export function CategoriesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const { all, refetch } = useCategories();

  useFocusEffect(
    useCallback(() => {
      const handle = requestIdleCallback(() => refetch());
      return () => cancelIdleCallback(handle);
    }, [refetch]),
  );

  const list = all.filter((c) => c.type === type);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: theme.colors.bgApp }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { gap: theme.spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appBar}>
          <AppBarBackTitle
            title={t('categoriesManage.title')}
            onBack={() => router.back()}
          />
        </View>

        <Text
          style={{
            fontFamily: theme.fonts.body.medium,
            fontSize: 13,
            color: theme.colors.textSecondary,
          }}
        >
          {t('categoriesManage.subtitle')}
        </Text>

        <SegmentedToggle
          options={[
            { label: t('newTransaction.expense'), value: 'expense' },
            { label: t('newTransaction.income'), value: 'income' },
          ]}
          value={type}
          onChange={(next) => setType(next as 'income' | 'expense')}
        />

        <View style={{ gap: theme.spacing.sm }}>
          {list.map((cat) => (
            <Pressable
              key={cat.key}
              accessibilityRole="button"
              accessibilityLabel={cat.label}
              onPress={() =>
                router.push({
                  pathname: '/yeni-kategori',
                  params: { key: cat.key },
                })
              }
              style={({ pressed }) => [
                styles.row,
                {
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.bgSurface,
                  opacity: pressed ? 0.7 : cat.hidden ? 0.5 : 1,
                },
              ]}
            >
              <CategoryIcon
                icon={cat.icon}
                tint={cat.tint ?? 'accentTeal'}
                color={cat.color}
                size={40}
              />
              <View style={styles.rowText}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: theme.fonts.body.semibold,
                    fontSize: 14,
                    color: theme.colors.textPrimary,
                  }}
                >
                  {cat.label}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body.medium,
                    fontSize: 11,
                    color: theme.colors.textTertiary,
                  }}
                >
                  {cat.hidden
                    ? t('categoriesManage.hiddenBadge')
                    : cat.custom
                      ? t('categoriesManage.customBadge')
                      : t('categoriesManage.builtinBadge')}
                </Text>
              </View>
              {createElement(getIcon('pencil'), {
                size: 16,
                color: theme.colors.textTertiary,
              })}
            </Pressable>
          ))}
        </View>

        <ButtonSecondary
          tone="accent"
          icon="plus"
          label={t('categoriesManage.add')}
          onPress={() =>
            router.push({ pathname: '/yeni-kategori', params: { type } })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  rowText: { flex: 1, gap: 2 },
});
