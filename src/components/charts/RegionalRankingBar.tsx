import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { RankingEntry } from '@utils/chartTransforms';
import { Colors, RiskColors, RiskBackgrounds } from '@constants/colors';
import { CategoriaRiscoLabels, NivelRiscoLabels } from '@constants/enums';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';

interface Props {
  data: RankingEntry[];
  onPress?: (idRegiao: number) => void;
}

export function RegionalRankingBar({ data, onPress }: Props) {
  if (data.length === 0) return null;

  const maxScore = Math.max(...data.map(d => d.scoreMedio), 100);

  return (
    <View style={styles.wrapper}>
      {data.map((entry, idx) => {
        const pct = (entry.scoreMedio / maxScore) * 100;
        const fg = RiskColors[entry.nivelRiscoMedio];
        const bg = RiskBackgrounds[entry.nivelRiscoMedio];

        return (
          <TouchableOpacity
            key={entry.idIndicador}
            style={styles.row}
            onPress={onPress ? () => onPress(entry.idRegiao) : undefined}
            activeOpacity={onPress ? 0.75 : 1}
          >
            {/* Rank badge */}
            <View style={[styles.rankBadge, idx < 3 ? { backgroundColor: fg } : styles.rankBadgeNeutral]}>
              <Text style={[styles.rankNum, idx < 3 ? styles.rankNumTop : null]}>
                {idx + 1}
              </Text>
            </View>

            {/* Info column */}
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{entry.nomeRegiao}</Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.estadoBadge, { backgroundColor: bg }]}>
                    <Text style={[styles.estadoText, { color: fg }]}>{entry.estado}</Text>
                  </View>
                  {entry.quantidadeAlertasAtivos > 0 ? (
                    <View style={styles.alertBadge}>
                      <Text style={styles.alertBadgeText}>
                        {entry.quantidadeAlertasAtivos} alerta{entry.quantidadeAlertasAtivos > 1 ? 's' : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.metaRow}>
                {entry.cidade ? (
                  <Text style={styles.cidade} numberOfLines={1}>{entry.cidade}</Text>
                ) : null}
                <Text style={styles.tipo}>{CategoriaRiscoLabels[entry.tipoRisco]}</Text>
              </View>

              {/* Progress bar */}
              <View style={styles.trackRow}>
                <View style={styles.track}>
                  <View style={[styles.bar, { width: `${pct}%` as unknown as number, backgroundColor: fg }]} />
                </View>
                <Text style={[styles.nivelLabel, { color: fg }]}>
                  {NivelRiscoLabels[entry.nivelRiscoMedio]}
                </Text>
              </View>
            </View>

            {/* Score box */}
            <View style={[styles.scoreBox, { backgroundColor: bg }]}>
              <Text style={[styles.scoreNum, { color: fg }]}>{entry.scoreMedio}</Text>
              <Text style={[styles.scorePts, { color: fg }]}>pts</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    rowGap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankBadgeNeutral: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankNum: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  rankNumTop: {
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
    rowGap: 3,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: Spacing.xs,
    flexWrap: 'wrap',
    rowGap: 2,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    flexShrink: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    columnGap: 4,
    alignItems: 'center',
  },
  estadoBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  estadoText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  alertBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  alertBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: '#D32F2F',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: Spacing.sm,
  },
  cidade: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flex: 1,
  },
  tipo: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: Spacing.xs,
    marginTop: 2,
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  nivelLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    minWidth: 56,
    textAlign: 'right',
  },
  scoreBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    flexShrink: 0,
  },
  scoreNum: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    lineHeight: 22,
  },
  scorePts: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    opacity: 0.75,
  },
});
