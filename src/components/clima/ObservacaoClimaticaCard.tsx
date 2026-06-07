/**
 * ObservacaoClimaticaCard — self-contained card showing the latest climate observation
 * for a region. Fetches GET /api/regioes/{id}/observacoes-climaticas/ultima and polls
 * every 10 s with silent refresh (no spinner flicker after first load).
 */
import { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@components/ui';
import { useObservacaoClimatica } from '@hooks/useObservacaoClimatica';
import { usePolling } from '@hooks/usePolling';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius } from '@constants/design';
import type { ObservacaoClimatica } from '@/types';

// ─── Metric tile ──────────────────────────────────────────────────────────────

interface TileProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent: string;
}

function MetricTile({ icon, label, value, accent }: TileProps) {
  return (
    <View style={tile.wrap}>
      <Ionicons name={icon} size={15} color={accent} />
      <Text style={[tile.value, { color: accent }]}>{value}</Text>
      <Text style={tile.label}>{label}</Text>
    </View>
  );
}

const tile = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 6,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    gap: 3,
  },
  value: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
});

// ─── Formatting helpers ───────────────────────────────────────────────────────

function semDado(v: number | null | undefined): boolean {
  return v == null;
}

function fmtNum(v: number | null | undefined, unit: string, dec = 0): string {
  if (v == null) return 'Sem dado';
  return dec > 0 ? `${v.toFixed(dec)} ${unit}`.trim() : `${Math.round(v)} ${unit}`.trim();
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function buildTiles(d: ObservacaoClimatica) {
  return [
    {
      icon: 'thermometer-outline' as const,
      label: 'Temperatura',
      value: fmtNum(d.temperatura, '°C', 1),
      accent: '#E53935',
      skip: false,
    },
    {
      icon: 'water-outline' as const,
      label: 'Umidade',
      value: semDado(d.umidade) ? 'Sem dado' : `${Math.round(d.umidade!)}%`,
      accent: '#1565C0',
      skip: false,
    },
    {
      icon: 'rainy-outline' as const,
      label: 'Precipitação',
      value: fmtNum(d.precipitacao, 'mm', 1),
      accent: '#0277BD',
      skip: false,
    },
    {
      icon: 'speedometer-outline' as const,
      label: 'Vento',
      value: fmtNum(d.vento, 'km/h'),
      accent: '#F57F17',
      skip: false,
    },
    {
      icon: 'arrow-up-circle-outline' as const,
      label: 'Pressão',
      value: fmtNum(d.pressaoHpa, 'hPa'),
      accent: '#6A1B9A',
      skip: false,
    },
    {
      icon: 'sunny-outline' as const,
      label: 'Índice UV',
      value: semDado(d.indiceUv) ? 'Sem dado' : d.indiceUv!.toFixed(1),
      accent: '#F9A825',
      skip: false,
    },
    {
      icon: 'flash-outline' as const,
      label: 'Radiação',
      value: fmtNum(d.radiacaoSolar, 'W/m²'),
      accent: '#FF6F00',
      skip: d.radiacaoSolar == null,
    },
  ].filter(t => !t.skip);
}

// ─── Card component ───────────────────────────────────────────────────────────

interface Props {
  idRegiao: number;
  title?: string;
}

export function ObservacaoClimaticaCard({ idRegiao, title }: Props) {
  const { status, data, errorMessage, load } = useObservacaoClimatica(idRegiao);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  usePolling(() => load({ silent: true }), 10_000);

  const cardTitle = title ?? 'Observação Climática Atual';
  const firstLoad = (status === 'loading' || status === 'idle') && !data;
  const isError   = status === 'error';

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="partly-sunny-outline" size={18} color={Colors.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{cardTitle}</Text>
          <Text style={styles.subtitle}>
            Dados meteorológicos persistidos utilizados como apoio ao cálculo de risco.
          </Text>
        </View>
      </View>

      {/* Initial loading */}
      {firstLoad && (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.mutedText}>Carregando observação climática...</Text>
        </View>
      )}

      {/* Error without prior data */}
      {isError && !data && (
        <Text style={styles.errorText}>
          {errorMessage ?? 'Não foi possível carregar a observação climática.'}
        </Text>
      )}

      {/* Stale-data note on re-fetch error */}
      {isError && data && (
        <Text style={styles.staleNote}>Atualização climática indisponível no momento.</Text>
      )}

      {/* Empty — API returned null (no observation for this region) */}
      {status === 'success' && !data && (
        <View style={styles.row}>
          <Ionicons name="cloud-offline-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.mutedText}>
            Observação climática recente não disponível para esta região.
          </Text>
        </View>
      )}

      {/* Data */}
      {data && (
        <>
          {data.fonte ? (
            <Text style={styles.fonte}>
              <Text style={styles.fonteLabel}>Fonte: </Text>
              {data.fonte}
            </Text>
          ) : null}

          <View style={styles.tileGrid}>
            {buildTiles(data).map(t => (
              <MetricTile key={t.label} icon={t.icon} label={t.label} value={t.value} accent={t.accent} />
            ))}
          </View>

          <Text style={styles.dtLine}>
            Observação: {fmtDate(data.dtObservacao)}
          </Text>
        </>
      )}
    </Card>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  mutedText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: '#D32F2F',
    paddingVertical: Spacing.xs,
  },
  staleNote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  fonte: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  fonteLabel: {
    fontWeight: '600',
    color: Colors.text,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dtLine: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
