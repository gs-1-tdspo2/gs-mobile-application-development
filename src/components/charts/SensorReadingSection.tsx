/**
 * SensorReadingSection — shows latest IoT sensor value + sparkline per series.
 * Uses custom React Native View bars (no Skia). Works on iOS, Android, and Web.
 */
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Card } from '@components/ui';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import type { SensorSeries } from '@utils/sensorTransforms';
import { scaledSparklinePoints, formatSensorValue } from '@utils/sensorTransforms';

// ─── Mini sparkline ───────────────────────────────────────────────────────────

interface SparklineProps {
  scaled: number[];
  color: string;
  height?: number;
}

function MiniSparkline({ scaled, color, height = 44 }: SparklineProps) {
  if (scaled.length === 0) return null;
  const barW = Math.max(3, Math.floor(260 / Math.max(scaled.length, 1)));
  return (
    <View style={[sparkStyles.wrapper, { height }]}>
      {scaled.map((v, i) => (
        <View
          key={i}
          style={[
            sparkStyles.bar,
            {
              width: barW,
              height: Math.max(3, v * height),
              backgroundColor: color,
              opacity: 0.45 + v * 0.55,
            },
          ]}
        />
      ))}
    </View>
  );
}

const sparkStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    columnGap: 2,
    overflow: 'hidden',
  },
  bar: {
    borderRadius: 2,
  },
});

// ─── Single series card ───────────────────────────────────────────────────────

interface SeriesCardProps {
  series: SensorSeries;
  color: string;
}

function SeriesCard({ series, color }: SeriesCardProps) {
  if (!series.available) {
    return (
      <View style={seriesStyles.unavailable}>
        <Text style={seriesStyles.unavailableField}>{series.label}</Text>
        <Text style={seriesStyles.unavailableText}>Dado não disponível pela API.</Text>
      </View>
    );
  }

  if (series.points.length === 0) {
    return (
      <View style={seriesStyles.unavailable}>
        <Text style={seriesStyles.unavailableField}>{series.label}</Text>
        <Text style={seriesStyles.unavailableText}>Nenhuma leitura registrada para este campo.</Text>
      </View>
    );
  }

  const scaled = scaledSparklinePoints(series, 24);
  const latestFormatted = formatSensorValue(series.latestValue, series.unit);
  const minFormatted = formatSensorValue(series.min, series.unit);
  const maxFormatted = formatSensorValue(series.max, series.unit);

  return (
    <View style={seriesStyles.card}>
      {/* Label */}
      <Text style={seriesStyles.seriesLabel}>{series.label}</Text>

      {/* Hero value + timestamp */}
      <View style={seriesStyles.heroRow}>
        <Text style={[seriesStyles.heroValue, { color }]}>{latestFormatted}</Text>
        {series.latestLabel ? (
          <Text style={seriesStyles.heroTime}>{series.latestLabel}</Text>
        ) : null}
      </View>

      {/* Min / Max / Count */}
      <View style={seriesStyles.statsRow}>
        <View style={seriesStyles.statItem}>
          <Text style={seriesStyles.statLabel}>Mín</Text>
          <Text style={seriesStyles.statValue}>{minFormatted}</Text>
        </View>
        <View style={seriesStyles.statDivider} />
        <View style={seriesStyles.statItem}>
          <Text style={seriesStyles.statLabel}>Máx</Text>
          <Text style={seriesStyles.statValue}>{maxFormatted}</Text>
        </View>
        <View style={seriesStyles.statDivider} />
        <View style={seriesStyles.statItem}>
          <Text style={seriesStyles.statLabel}>Leituras</Text>
          <Text style={seriesStyles.statValue}>{series.points.length}</Text>
        </View>
      </View>

      {/* Sparkline */}
      {scaled.length > 1 ? (
        <View style={seriesStyles.sparkArea}>
          <MiniSparkline scaled={scaled} color={color} height={40} />
          <Text style={seriesStyles.sparkCaption}>Tendência recente</Text>
        </View>
      ) : null}
    </View>
  );
}

const seriesStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    rowGap: Spacing.xs,
  },
  seriesLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    columnGap: Spacing.sm,
    flexWrap: 'wrap',
  },
  heroValue: {
    fontSize: FontSize.title,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 36,
  },
  heroTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: Spacing.xs,
    marginTop: 2,
  },
  statItem: {
    alignItems: 'flex-start',
    rowGap: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  sparkArea: {
    marginTop: Spacing.xs,
    rowGap: 3,
  },
  sparkCaption: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  unavailable: {
    paddingVertical: Spacing.xs,
  },
  unavailableField: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
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
  const anyAvailable = seriesEntries.some(([, s]) => s.available);
  const anyData = seriesEntries.some(([, s]) => s.points.length > 0);

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
      ) : !anyAvailable || !anyData ? (
        <View style={sectionStyles.center}>
          <Text style={sectionStyles.centerText}>
            Nenhuma leitura IoT encontrada para esta região.
          </Text>
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
