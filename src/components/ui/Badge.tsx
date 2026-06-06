import { View, Text, StyleSheet } from 'react-native';
import { RiskColors, RiskBackgrounds } from '@constants/colors';
import { NivelRiscoLabels, StatusAlertaLabels } from '@constants/enums';
import type { NivelRisco, StatusAlerta } from '@constants/enums';
import { FontSize, Radius, Spacing } from '@constants/design';
import { Colors } from '@constants/colors';

// ─── Risk Badge ───────────────────────────────────────────────────────────────
interface RiskBadgeProps {
  nivel: NivelRisco;
}

export function RiskBadge({ nivel }: RiskBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: RiskBackgrounds[nivel] }]}>
      <Text style={[styles.text, { color: RiskColors[nivel] }]}>
        {NivelRiscoLabels[nivel]}
      </Text>
    </View>
  );
}

// ─── Alert Status Badge ───────────────────────────────────────────────────────
const statusStyles: Record<StatusAlerta, { bg: string; fg: string }> = {
  ABERTO: { bg: '#FFEBEE', fg: '#D32F2F' },
  EM_ANALISE: { bg: '#FFF3E0', fg: '#EF6C00' },
  RESOLVIDO: { bg: '#E8F5E9', fg: '#2E7D32' },
  CANCELADO: { bg: '#F5F5F5', fg: '#9E9E9E' },
};

interface AlertaBadgeProps {
  status: StatusAlerta;
}

export function AlertaBadge({ status }: AlertaBadgeProps) {
  const s = statusStyles[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.fg }]}>
        {StatusAlertaLabels[status]}
      </Text>
    </View>
  );
}

// ─── Generic Badge ────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
  background?: string;
}

export function Badge({ label, color = Colors.textMuted, background = Colors.background }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
