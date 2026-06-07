/**
 * SensorReadingSection — KPI card per series with full-width bar chart + timestamp axis.
 * Uses custom React Native View bars (no Skia). Works on iOS, Android, and Web.
 * Layout reference: dashboard with large value, unit row, bar history, x-axis timestamps.
 */
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Card } from '@components/ui';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import type { SensorSeries } from '@utils/sensorTransforms';
import { SvgLineChart } from './SvgLineChart';

// ─── Value formatting ─────────────────────────────────────────────────────────

function displayNumber(value: number | null, unit: string): string {
  if (value === null) return '—';
  switch (unit) {
    case 'hPa':    return value.toFixed(1);
    case '%':      return value.toFixed(1);
    case 'cm':     return value.toFixed(1);
    case 'µg/m³':  return value.toFixed(0);
    case '°':      return value.toFixed(2);
    case 'índice': return value.toFixed(3);
    default:       return String(value);
  }
}

function displayUnit(unit: string): string {
  switch (unit) {
    case '%':      return '% de ocupação';
    case 'cm':     return 'cm do sensor';
    case 'índice': return 'rad/s acum.';
    default:       return unit;
  }
}


// ─── Single series card ───────────────────────────────────────────────────────

interface SeriesCardProps {
  series: SensorSeries;
  color: string;
}

function SeriesCard({ series, color }: SeriesCardProps) {
  const hasData = series.available && series.points.length > 0;

  if (!hasData) {
    return (
      <View style={sc.unavailable}>
        <Text style={sc.unavailableField}>{series.label.toUpperCase()}</Text>
        <Text style={sc.unavailableText}>
          {series.available
            ? 'Nenhuma leitura registrada para este campo.'
            : 'Dado não disponível pela API.'}
        </Text>
      </View>
    );
  }

  const numStr  = displayNumber(series.latestValue, series.unit);
  const minStr  = displayNumber(series.min, series.unit);
  const maxStr  = displayNumber(series.max, series.unit);
  const unitStr = displayUnit(series.unit);

  return (
    <View style={[sc.card, { borderTopColor: color }]}>
      {/* Field name */}
      <Text style={sc.fieldName}>{series.label.toUpperCase()}</Text>

      {/* Hero: large number + unit below */}
      <Text style={[sc.heroValue, { color }]}>{numStr}</Text>
      <Text style={sc.heroUnit}>{unitStr}</Text>

      {/* Stats row */}
      <View style={sc.statsRow}>
        <View style={sc.statItem}>
          <Text style={sc.statLabel}>MÍN</Text>
          <Text style={sc.statValue}>{minStr}</Text>
        </View>
        <View style={sc.statSep} />
        <View style={sc.statItem}>
          <Text style={sc.statLabel}>MÁX</Text>
          <Text style={sc.statValue}>{maxStr}</Text>
        </View>
        <View style={sc.statSep} />
        <View style={sc.statItem}>
          <Text style={sc.statLabel}>LEITURAS</Text>
          <Text style={sc.statValue}>{series.points.length}</Text>
        </View>
        {series.latestLabel ? (
          <>
            <View style={sc.statSep} />
            <View style={sc.statItem}>
              <Text style={sc.statLabel}>ÚLT. LEITURA</Text>
              <Text style={sc.statValue}>{series.latestLabel}</Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Line chart with timestamps */}
      <SvgLineChart points={series.points} color={color} unit={series.unit} />
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderTopWidth: 3,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    rowGap: Spacing.xs,
  },
  fieldName: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  heroValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 38,
    marginTop: 2,
  },
  heroUnit: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.xs,
  },
  statItem: {
    alignItems: 'flex-start',
    gap: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  statSep: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
  },
  unavailable: {
    paddingVertical: Spacing.xs,
  },
  unavailableField: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  unavailableText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});

// ─── Public section component ─────────────────────────────────────────────────

interface DimensionSeries {
  [key: string]: SensorSeries;
}

interface SensorReadingSectionProps {
  title: string;
  componente: string;
  color: string;
  seriesMap: DimensionSeries;
  loading?: boolean;
  error?: string | null;
}

export function SensorReadingSection({
  title,
  componente,
  color,
  seriesMap,
  loading,
  error,
}: SensorReadingSectionProps) {
  const seriesEntries = Object.entries(seriesMap);

  return (
    <Card style={sectionStyles.card}>
      {/* Colored header bar */}
      <View style={[sectionStyles.headerBar, { borderLeftColor: color }]}>
        <View style={sectionStyles.headerText}>
          <Text style={sectionStyles.title}>{title}</Text>
          <Text style={sectionStyles.componente}>{componente}</Text>
        </View>
        <View style={[sectionStyles.colorDot, { backgroundColor: color }]} />
      </View>

      {loading ? (
        <View style={sectionStyles.center}>
          <ActivityIndicator color={color} size="small" />
          <Text style={sectionStyles.centerText}>Carregando leituras...</Text>
        </View>
      ) : error ? (
        <View style={sectionStyles.center}>
          <Text style={sectionStyles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={sectionStyles.seriesContainer}>
          {seriesEntries.map(([key, s]) => (
            <SeriesCard key={key} series={s} color={color} />
          ))}
        </View>
      )}
    </Card>
  );
}

const sectionStyles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  headerBar: {
    borderLeftWidth: 4,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  headerText: {
    flex: 1,
    rowGap: 2,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  componente: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
    marginLeft: Spacing.sm,
  },
  center: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    rowGap: Spacing.xs,
  },
  centerText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: '#D32F2F',
    textAlign: 'center',
  },
  seriesContainer: {
    padding: Spacing.md,
    rowGap: Spacing.sm,
  },
});
