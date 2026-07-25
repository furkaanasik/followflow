import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface BadgeCountProps {
  count: number;
  testID?: string;
}

// Small accent circle for counters (e.g. active filters). Renders nothing
// at zero so callers don't need their own guard.
export function BadgeCount({ count, testID }: BadgeCountProps) {
  const theme = useTheme();
  if (count <= 0) return null;
  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.accentTeal,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: theme.fonts.body.semibold,
          fontSize: 10,
          color: theme.colors.bgApp,
        }}
      >
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
