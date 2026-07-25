import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ButtonIconOnly } from '@/atoms';
import type { CalendarDay, CalendarMarker } from '@/lib/calendar';
import { useTheme } from '@/theme';

export interface CalendarMonthCardProps {
  monthLabel: string;
  weekdayLabels: string[];
  days: CalendarDay[];
  selectedDate: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (date: string) => void;
}

export function CalendarMonthCard({
  monthLabel,
  weekdayLabels,
  days,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: CalendarMonthCardProps) {
  const theme = useTheme();

  const markerColor = (marker: CalendarMarker) =>
    marker === 'payment'
      ? theme.colors.expenseCoral
      : marker === 'payday'
        ? theme.colors.incomeGreen
        : theme.colors.accentTeal;

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bgSurface,
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <View style={styles.header}>
        <ButtonIconOnly
          icon="chevron-left"
          variant="surface"
          size={32}
          accessibilityLabel="previous month"
          onPress={onPrevMonth}
        />
        <Text
          style={{
            fontFamily: theme.fonts.heading.semibold,
            fontSize: 15,
            color: theme.colors.textPrimary,
          }}
        >
          {monthLabel}
        </Text>
        <ButtonIconOnly
          icon="chevron-right"
          variant="surface"
          size={32}
          accessibilityLabel="next month"
          onPress={onNextMonth}
        />
      </View>

      <View style={styles.row}>
        {weekdayLabels.map((label) => (
          <Text
            key={label}
            style={[
              styles.weekday,
              {
                fontFamily: theme.fonts.body.medium,
                color: theme.colors.textTertiary,
              },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      {Array.from({ length: 6 }, (_, week) => (
        <View key={week} style={styles.row}>
          {days.slice(week * 7, week * 7 + 7).map((day) => {
            const selected = day.date === selectedDate;
            return (
              <Pressable
                key={day.date}
                onPress={() => onSelectDay(day.date)}
                accessibilityRole="button"
                accessibilityLabel={day.date}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.dayCircle,
                    {
                      borderRadius: theme.radius.full,
                      backgroundColor: selected
                        ? theme.colors.accentTeal
                        : 'transparent',
                      borderWidth: day.isToday && !selected ? 1 : 0,
                      borderColor: theme.colors.accentTeal,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: theme.fonts.body.medium,
                      fontSize: 13,
                      color: selected
                        ? theme.colors.bgApp
                        : day.inMonth
                          ? theme.colors.textPrimary
                          : theme.colors.textTertiary,
                    }}
                  >
                    {day.day}
                  </Text>
                </View>
                <View style={styles.markersRow}>
                  {day.markers.slice(0, 3).map((marker) => (
                    <View
                      key={marker}
                      style={[
                        styles.dot,
                        { backgroundColor: markerColor(marker) },
                      ]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, fontSize: 11, textAlign: 'center' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  dayCircle: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markersRow: {
    flexDirection: 'row',
    gap: 2,
    height: 5,
    alignItems: 'center',
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
