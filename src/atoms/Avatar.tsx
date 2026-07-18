import { Image } from 'expo-image';
import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface AvatarProps {
  size?: number;
  imageUri?: string;
}

export function Avatar({ size = 52, imageUri }: AvatarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.bgSurfaceAlt,
        },
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size }}
          contentFit="cover"
        />
      ) : (
        createElement(getIcon('user'), {
          size: Math.round(size * 0.42),
          color: theme.colors.textSecondary,
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
