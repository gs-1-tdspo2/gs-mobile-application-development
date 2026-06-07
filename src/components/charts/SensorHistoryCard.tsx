import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '@components/ui';
import { SvgLineChart } from './SvgLineChart';
import { buildHistorySeries } from '@utils/sensorTransforms';
import type { HistoryPeriod } from '@utils/sensorTransforms';
import type { LeituraIot } from '@/types';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius } from '@constants/design';

const PERIODS: { key: HistoryPeriod; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: '24h',   label: '24h' },
  { key: '7d',    label: '7 dias' },
  { key: 'all',   label: 'Tudo' },
];

interface Props {
  title: string;
  sensorName: string;
  color: string;
  leituras: LeituraIot[];
  primaryField: string;
  primaryLabel: string;
  primaryUnit: string;
  secondaryField?: string;
  secondaryLabel?: string;
  secondaryUnit?: string;
}

function fmtStat(v: number | null, unit: string): string {
  if (v === null) return '—';
  if (unit === '%')      return `${v.toFixed(1)}%`;
  if (unit === 'cm')     return `${v.toFixed(1)} cm`;
  if (unit === 'hPa')    return `${v.toFixed(1)} hPa`;
  if (unit === 'µg/m³')  return `${v.toFixed(0)} µg/m³`;
  if (unit === '°')      return `${v.toFixed(1)}°`;
  if (unit === 'índice') return v.toFixed(3);
  return String(Math.round(v * 10) / 10);
}

export function SensorHistoryCard({
  title,
  sensorName,
  color,
  leituras,
  primaryField,
  primaryLabel,
  primaryUnit,
  secondaryField,
  secondaryLabel,
  secondaryUnit,
}: Props) {
  const [period, setPeriod] = useState<HistoryPeriod>('24h');

  const primary = useMemo(
    () => buildHistorySeries(leituras, primaryField, primaryLabel, primaryUnit, period),
    [leituras, primaryField, primaryLabel, primaryUnit, period],
  );

  const secondary = useMemo(
    () =>
      secondaryField && secondaryLabel && secondaryUnit
        ? buildHistorySeries(leituras, secondaryField, secondaryLabel, secondaryUnit, period)
        : null,
    [leituras, secondaryField, secondaryLabel, secondaryUnit, period],
  );

  const hasData = primary.stats.count > 0;

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sensor}>{sensorName}</Text>
          </View>
        </View>

        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.periodBtn,
                period === p.key && { backgroundColor: color + '22', borderColor: color },
              ]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodText, period === p.key && { color }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Empty state */}
      {!hasData && (
        <Text style={styles.emptyText}>Sem dados disponíveis para este sensor.</Text>
      )}

      {hasData && (
        <>
          {/* Stats row */}
          <View style={styles.statsRow}>
            {([
              { label: 'ATUAL',    val: fmtStat(primary.stats.latest, primaryUnit) },
              { label: 'MÉDIA',    val: fmtStat(primary.stats.avg,    primaryUnit) },
              { label: 'MÍN',      val: fmtStat(primary.stats.min,    primaryUnit) },
              { label: 'MÁX',      val: fmtStat(primary.stats.max,    primaryUnit) },
              { label: 'LEITURAS', val: String(primary.stats.count) },
            ] as const).map(s => (
              <View key={s.label} style={styles.statChip}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={[styles.statValue, s.label === 'ATUAL' && { color }]}>{s.val}</Text>
              </View>
            ))}
          </View>

          {/* Chart */}
          {primary.aggregated && (
            <Text style={styles.aggregateNote}>Média diária</Text>
          )}
          {primary.points.length >= 2 ? (
            <SvgLineChart points={primary.points} color={color} unit={primaryUnit} height={130} />
          ) : (
            <Text style={styles.emptyText}>
              {primary.stats.count === 1
                ? 'Apenas 1 leitura — gráfico disponível com 2 ou mais pontos.'
                : 'Dados insuficientes para exibir gráfico.'}
            </Text>
          )}

          {/* Secondary metric summary */}
          {secondary && secondary.stats.count > 0 && (
            <View style={styles.secondaryRow}>
              <Text style={styles.secondaryHeading}>{secondaryLabel?.toUpperCase()}</Text>
              <Text style={styles.secondaryChip}>
                Atual: {fmtStat(secondary.stats.latest, secondaryUnit!)}
              </Text>
              <Text style={styles.secondaryChip}>
                {' · '}Mín: {fmtStat(secondary.stats.min, secondaryUnit!)}
              </Text>
              <Text style={styles.secondaryChip}>
                {' · '}Máx: {fmtStat(secondary.stats.max, secondaryUnit!)}
              </Text>
              <Text style={styles.secondaryChip}>
                {' · '}N: {secondary.stats.count}
              </Text>
            </View>
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  sensor: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 4,
  },
  periodBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  statChip: {
    flex: 1,
    minWidth: 48,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 1,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  aggregateNote: {
    fontSize: 9,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
    marginBottom: 2,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
    paddingVertical: Spacing.xs,
  },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  secondaryHeading: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  secondaryChip: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
