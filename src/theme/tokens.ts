export type ThemeMode = 'dark' | 'light' | 'vibrant' | 'vibrant-dark';

export const THEME_MODES: ThemeMode[] = [
  'dark',
  'light',
  'vibrant',
  'vibrant-dark',
];

export interface ColorTokens {
  accentTeal: string;
  accentTealDim: string;
  bgApp: string;
  bgSurface: string;
  bgSurfaceAlt: string;
  borderSubtle: string;
  expenseCoral: string;
  expenseCoralDim: string;
  incomeGreen: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  warningBg: string;
  warningRed: string;
}

export const COLOR_TOKENS: Record<ThemeMode, ColorTokens> = {
  dark: {
    accentTeal: '#3ECF9A',
    accentTealDim: '#20342C',
    bgApp: '#10161A',
    bgSurface: '#1A2226',
    bgSurfaceAlt: '#212B30',
    borderSubtle: '#2A363B',
    expenseCoral: '#E2897E',
    expenseCoralDim: '#3A2622',
    incomeGreen: '#6FCF97',
    textPrimary: '#F2F5F4',
    textSecondary: '#8FA0A6',
    textTertiary: '#5C6C71',
    warningBg: '#3A2020',
    warningRed: '#E5484D',
  },
  light: {
    accentTeal: '#1E9E75',
    accentTealDim: '#DFF3EA',
    bgApp: '#F7F9F8',
    bgSurface: '#FFFFFF',
    bgSurfaceAlt: '#EEF2F1',
    borderSubtle: '#E1E7E5',
    expenseCoral: '#D6584C',
    expenseCoralDim: '#FBEAE7',
    incomeGreen: '#248A5D',
    textPrimary: '#101A17',
    textSecondary: '#5C6B67',
    textTertiary: '#8B9793',
    warningBg: '#FBE9E9',
    warningRed: '#D6373D',
  },
  vibrant: {
    accentTeal: '#6D4DF2',
    accentTealDim: '#EAE6FD',
    bgApp: '#F5F4F7',
    bgSurface: '#FFFFFF',
    bgSurfaceAlt: '#EEEDF5',
    borderSubtle: '#E3E1EC',
    expenseCoral: '#F2545B',
    expenseCoralDim: '#FDE8E9',
    incomeGreen: '#2F80ED',
    textPrimary: '#16141F',
    textSecondary: '#625F72',
    textTertiary: '#9694A6',
    warningBg: '#FDF1E7',
    warningRed: '#E8590C',
  },
  'vibrant-dark': {
    accentTeal: '#8B6FF7',
    accentTealDim: '#2C2540',
    bgApp: '#14121B',
    bgSurface: '#1E1B29',
    bgSurfaceAlt: '#262233',
    borderSubtle: '#332E42',
    expenseCoral: '#F2837E',
    expenseCoralDim: '#3D2426',
    incomeGreen: '#5B9BF5',
    textPrimary: '#F3F1F8',
    textSecondary: '#A9A5BA',
    textTertiary: '#726C82',
    warningBg: '#3D2A14',
    warningRed: '#F2994A',
  },
};

export const SPACING = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 } as const;
export const RADIUS = { sm: 10, md: 16, lg: 22, full: 999 } as const;

export const FONT_FAMILIES = {
  heading: {
    regular: 'Geist_400Regular',
    semibold: 'Geist_600SemiBold',
    bold: 'Geist_700Bold',
  },
  body: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
  },
} as const;

export interface Theme {
  mode: ThemeMode;
  colors: ColorTokens;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  fonts: typeof FONT_FAMILIES;
}

export function getThemeTokens(mode: ThemeMode): Theme {
  return {
    mode,
    colors: COLOR_TOKENS[mode],
    spacing: SPACING,
    radius: RADIUS,
    fonts: FONT_FAMILIES,
  };
}
