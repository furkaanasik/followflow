export function withAlpha(hex: string, alphaHex: string): string {
  return `${hex}${alphaHex}`;
}

// Distinct categorical hues for charts (donut slices, legends). Semantic
// tokens like accent-teal and income-green are too close to read apart, so
// these are fixed mid-saturation hues chosen to stay legible on both the
// near-black (dark) and off-white (light) surfaces across all themes.
export const CHART_PALETTE = [
  '#2DD4BF', // teal
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#F43F5E', // rose
  '#3B82F6', // blue
  '#EC4899', // pink
  '#84CC16', // lime
  '#F97316', // orange
];
