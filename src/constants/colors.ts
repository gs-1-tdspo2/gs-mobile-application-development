export const Colors = {
  primary: '#3F51B5',
  primaryDark: '#3347A8',
  primaryLight: '#5A6FD6',

  background: '#F4F5F7',
  card: '#FFFFFF',

  text: '#1F2937',
  textMuted: '#6B7280',
  border: '#DDE2EA',
} as const;

// Keys match backend NivelRisco enum exactly
export const RiskColors = {
  CRITICO: '#D32F2F',
  ALTO: '#EF6C00',
  MODERADO: '#F9A825',
  BAIXO: '#2E7D32',
} as const;

export const RiskBackgrounds = {
  CRITICO: '#FFEBEE',
  ALTO: '#FFF3E0',
  MODERADO: '#FFFDE7',
  BAIXO: '#E8F5E9',
} as const;

export type NivelRiscoColor = keyof typeof RiskColors;
