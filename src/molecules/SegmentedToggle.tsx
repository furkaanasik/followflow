import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme';

export interface SegmentedToggleOption {
  label: string;
  value: string;
}

export interface SegmentedToggleProps {
  options: SegmentedToggleOption[];
  value: string;
  onChange: (value: string) => void;
}

const TRACK_PADDING = 3;

export function SegmentedToggle({
  options,
  value,
  onChange,
}: SegmentedToggleProps) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const position = useSharedValue(selectedIndex);

  useEffect(() => {
    position.value = withTiming(selectedIndex, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedIndex, position]);

  const segmentWidth =
    options.length > 0 && trackWidth > 0
      ? (trackWidth - TRACK_PADDING * 2) / options.length
      : 0;

  const thumbStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: position.value * segmentWidth }] }),
    [segmentWidth],
  );

  function handleLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.track,
        {
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.bgSurfaceAlt,
        },
      ]}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            styles.thumb,
            {
              width: segmentWidth,
              borderRadius: theme.radius.sm - TRACK_PADDING,
              backgroundColor: theme.colors.accentTealDim,
              borderColor: withAlpha(theme.colors.accentTeal, '3D'),
            },
            thumbStyle,
          ]}
          pointerEvents="none"
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={styles.option}
          >
            <Text
              style={{
                fontFamily: selected
                  ? theme.fonts.body.semibold
                  : theme.fonts.body.medium,
                fontSize: 13,
                color: selected
                  ? theme.colors.accentTeal
                  : theme.colors.textSecondary,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: TRACK_PADDING,
  },
  thumb: {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    borderWidth: 1,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});
