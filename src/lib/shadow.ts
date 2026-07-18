import type { ViewStyle } from 'react-native';

export function elevatedShadow(
  color: string,
  opacity: number,
  offsetY: number,
  blurRadius: number,
): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blurRadius,
    elevation: Math.round(blurRadius / 2),
  };
}
