import type { ThemeVars } from '@mysten/dapp-kit';

/** dapp-kit connect modal, restyled to the TGE identity. */
export const walletTheme: ThemeVars = {
  blurs: { modalOverlay: 'blur(0)' },
  backgroundColors: {
    primaryButton: '#FF5A1F',
    primaryButtonHover: '#ECE8DF',
    outlineButtonHover: '#121211',
    modalOverlay: 'rgba(10 10 9 / 82%)',
    modalPrimary: '#0A0A09',
    modalSecondary: '#121211',
    iconButton: 'transparent',
    iconButtonHover: '#2B2A26',
    dropdownMenu: '#0A0A09',
    dropdownMenuSeparator: '#2B2A26',
    walletItemSelected: '#2B2A26',
    walletItemHover: '#121211',
  },
  borderColors: { outlineButton: '#2B2A26' },
  colors: {
    primaryButton: '#0A0A09',
    outlineButton: '#ECE8DF',
    iconButton: '#ECE8DF',
    body: '#ECE8DF',
    bodyMuted: '#A19C90',
    bodyDanger: '#FF5A1F',
  },
  radii: { small: '0px', medium: '0px', large: '0px', xlarge: '0px' },
  shadows: { primaryButton: 'none', walletItemSelected: 'none' },
  fontWeights: { normal: '400', medium: '500', bold: '700' },
  fontSizes: { small: '13px', medium: '15px', large: '17px', xlarge: '20px' },
  typography: {
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontStyle: 'normal',
    lineHeight: '1.4',
    letterSpacing: '0.02em',
  },
};
