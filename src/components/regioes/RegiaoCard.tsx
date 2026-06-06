import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@components/ui/Badge';
import { Colors, RiskColors, RiskBackgrounds } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import { TipoAreaLabels } from '@constants/enums';
import type { RegiaoMonitorada } from '@/types';

function vulLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 75) return { label: 'Crítica', color: RiskColors.CRITICO, bg: RiskBackgrounds.CRITICO };
  if (score >= 50) return { label: 'Alta', color: RiskColors.ALTO, bg: RiskBackgrounds.ALTO };
  if (score >= 25) return { label: 'Moderada', color: RiskColors.MODERADO, bg: RiskBackgrounds.MODERADO };
  return { label: 'Baixa', color: RiskColors.BAIXO, bg: RiskBackgrounds.BAIXO };
}

interface RegiaoCardProps {
  regiao: RegiaoMonitorada;
  onPress: () => void;
}

export function RegiaoCard({ regiao, onPress }: RegiaoCardProps) {
  const vul = vulLevel(regiao.nivelVulnerabilidade);
  const isActive = regiao.stAtivo !== 'N';

  return (
    <TouchableOpacity
      style={[styles.card, !isActive && styles.cardInactive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.accent, { backgroundColor: vul.color }]} />

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.nome, !isActive && styles.textMuted]}
            numberOfLines={1}
          >
            {regiao.nome}
          </Text>
          {isActive ? (
            <View style={styles.ativaBadge}>
              <Text style={styles.ativaText}>Ativa</Text>
            </View>
          ) : (
            <View style={styles.inativaBadge}>
              <Text style={styles.inativaText}>Inativa</Text>
            </View>
          )}
        </View>

        <Text style={styles.sub}>
          {regiao.cidade}, {regiao.estado}
        </Text>

        <View style={styles.tagsRow}>
          <Badge label={TipoAreaLabels[regiao.tipoArea]} />
          <View style={[styles.vulBadge, { backgroundColor: vul.bg }]}>
            <Text style={[styles.vulText, { color: vul.color }]}>
              {vul.label} · {regiao.nivelVulnerabilidade}%
            </Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardInactive: {
    opacity: 0.6,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nome: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  textMuted: {
    color: Colors.textMuted,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 2,
  },
  vulBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  vulText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  ativaBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: '#E8F5E9',
  },
  ativaText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: '#2E7D32',
  },
  inativaBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
  },
  inativaText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  chevron: {
    marginRight: Spacing.sm,
  },
});
