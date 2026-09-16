/**
 * Tokens de design do blog: cores, espaçamentos, tipografia e breakpoints.
 * Tudo que é visual passa por aqui para as telas ficarem consistentes.
 */
export const theme = {
  colors: {
    primary: '#1f6f5c',
    primaryDark: '#16523f',
    primaryLight: '#e6f2ee',
    accent: '#c2410c',
    danger: '#b91c1c',
    dangerLight: '#fee2e2',
    success: '#15803d',
    successLight: '#dcfce7',
    text: '#1c2523',
    textMuted: '#5c6b67',
    background: '#f6f8f7',
    surface: '#ffffff',
    border: '#dde5e2',
    focus: '#0f766e',
  },
  spacing: (multiplier: number) => `${multiplier * 4}px`,
  radii: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    pill: '999px',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.5rem',
    xxl: '2rem',
  },
  shadows: {
    sm: '0 1px 2px rgba(16, 34, 29, 0.06)',
    md: '0 6px 18px rgba(16, 34, 29, 0.08)',
  },
  // Usados nas media queries: `@media (min-width: ${theme.breakpoints.md})`
  breakpoints: {
    sm: '480px',
    md: '768px',
    lg: '1024px',
  },
  maxWidth: '960px',
} as const;

export type AppTheme = typeof theme;
