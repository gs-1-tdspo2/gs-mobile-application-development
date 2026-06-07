import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import type { CategoriaRisco } from '@constants/enums';
import { CategoriaRiscoLabels } from '@constants/enums';
import { RiskColors, RiskBackgrounds } from '@constants/colors';
import type { NivelRisco } from '@constants/enums';

// ─── Static sensor dimension data ─────────────────────────────────────────────

export interface SensorDimension {
  id: string;
  componente: string;
  tipo: 'REAL' | 'SIMULADA' | 'REFERENCIA';
  simulacaoNota?: string;
  risco: CategoriaRisco;
  campos: string[];
  papel: string;
  interpretacao: string;
  cor: string;
}

export const SENSOR_DIMENSIONS: SensorDimension[] = [
  {
    id: 'hcsr04',
    componente: 'HC-SR04',
    tipo: 'REAL',
    risco: 'ENCHENTE',
    campos: ['distanciaAguaCm', 'nivelAguaPercentual'],
    papel: 'Nível de água',
    interpretacao:
      'Mede a distância até a superfície da água por ultrassom. ' +
      'Distâncias menores indicam elevação do nível — útil em rios, córregos, canais e ' +
      'sistemas de drenagem urbana.',
    cor: '#1565C0',
  },
  {
    id: 'slider_pm',
    componente: 'Potenciômetro Slider',
    tipo: 'SIMULADA',
    simulacaoNota:
      'O Wokwi não suporta o sensor PMS5003. O slider simula a concentração de ' +
      'material particulado (PM2.5 / PM10) para fins de prototipagem.',
    risco: 'QUALIDADE_AR',
    campos: ['pm25', 'pm10'],
    papel: 'Qualidade do ar simulada',
    interpretacao:
      'Simula PM2.5 (partículas finas) e PM10 (partículas grossas) como substituto ' +
      'ao PMS5003. Valores elevados indicam fumaça, poluição ou queimadas na região.',
    cor: '#6A1B9A',
  },
  {
    id: 'bmp180',
    componente: 'BMP180',
    tipo: 'REAL',
    risco: 'TEMPESTADE',
    campos: ['pressaoHpa'],
    papel: 'Pressão atmosférica',
    interpretacao:
      'Mede a pressão em hectopascal. Quedas rápidas abaixo de ~1005 hPa sinalizam ' +
      'sistemas de baixa pressão e possibilidade de tempestades. Valores normais: 1010–1020 hPa.',
    cor: '#00695C',
  },
  {
    id: 'mpu6050',
    componente: 'MPU6050',
    tipo: 'REAL',
    risco: 'DESLIZAMENTO',
    campos: ['inclinacaoGraus', 'vibracao'],
    papel: 'Inclinação e vibração',
    interpretacao:
      'Acelerômetro e giroscópio que detecta inclinação de encostas e tremores do solo. ' +
      'Mudanças abruptas na inclinação ou picos de vibração podem indicar início de ' +
      'deslizamento ou instabilidade estrutural.',
    cor: '#BF360C',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  dimension: SensorDimension;
}

function TipoBadge({ tipo, nota }: { tipo: SensorDimension['tipo']; nota?: string }) {
  const labels: Record<SensorDimension['tipo'], string> = {
    REAL: 'Componente real',
    SIMULADA: 'Simulação Wokwi',
    REFERENCIA: 'Referência',
  };
  const bgMap: Record<SensorDimension['tipo'], string> = {
    REAL: '#E8F5E9',
    SIMULADA: '#FFF8E1',
    REFERENCIA: '#E3F2FD',
  };
  const fgMap: Record<SensorDimension['tipo'], string> = {
    REAL: '#2E7D32',
    SIMULADA: '#F57F17',
    REFERENCIA: '#1565C0',
  };
  return (
    <View style={[styles.tipoBadge, { backgroundColor: bgMap[tipo] }]}>
      <Text style={[styles.tipoBadgeText, { color: fgMap[tipo] }]}>{labels[tipo]}</Text>
      {nota ? <Text style={[styles.tipoBadgeNota, { color: fgMap[tipo] }]}>{nota}</Text> : null}
    </View>
  );
}

export function SensorDimensionCard({ dimension }: Props) {
  const riskColor = RiskColors[dimension.risco as NivelRisco] ?? dimension.cor;
  const riskBg = RiskBackgrounds[dimension.risco as NivelRisco] ?? '#F5F5F5';

  return (
    <View style={styles.card}>
      {/* Header strip */}
      <View style={[styles.headerStrip, { backgroundColor: dimension.cor }]}>
        <Text style={styles.componenteLabel}>Componente</Text>
        <Text style={styles.componenteNome}>{dimension.componente}</Text>
        <Text style={styles.papelLabel}>{dimension.papel}</Text>
      </View>

      <View style={styles.body}>
        {/* Risk badge */}
        <View style={[styles.riscoBadge, { backgroundColor: riskBg }]}>
          <Text style={styles.riscoCaption}>Risco associado</Text>
          <Text style={[styles.riscoLabel, { color: riskColor }]}>
            {CategoriaRiscoLabels[dimension.risco]}
          </Text>
        </View>

        {/* Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campos de leitura</Text>
          <View style={styles.campos}>
            {dimension.campos.map(c => (
              <View key={c} style={styles.campoChip}>
                <Text style={styles.campoText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Type badge */}
        <TipoBadge tipo={dimension.tipo} nota={dimension.simulacaoNota} />

        {/* Interpretation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interpretação operacional</Text>
          <Text style={styles.interpretacao}>{dimension.interpretacao}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Responsive grid wrapper ──────────────────────────────────────────────────

export function SensorDimensionGrid() {
  const { width } = useWindowDimensions();
  const cols = width >= 900 ? 3 : width >= 600 ? 2 : 1;

  if (cols === 1) {
    return (
      <View style={styles.gridSingle}>
        {SENSOR_DIMENSIONS.map(d => (
          <SensorDimensionCard key={d.id} dimension={d} />
        ))}
      </View>
    );
  }

  // For multi-column: split into rows of `cols` items
  const rows: SensorDimension[][] = [];
  for (let i = 0; i < SENSOR_DIMENSIONS.length; i += cols) {
    rows.push(SENSOR_DIMENSIONS.slice(i, i + cols));
  }

  return (
    <View style={styles.gridMulti}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.gridRow}>
          {row.map(d => (
            <View key={d.id} style={[styles.gridCell, { width: `${100 / cols}%` as unknown as number }]}>
              <SensorDimensionCard dimension={d} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  headerStrip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  componenteLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  componenteNome: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  papelLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  body: {
    padding: Spacing.md,
    rowGap: Spacing.sm,
  },
  riscoBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  riscoCaption: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  riscoLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  section: {
    rowGap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  campos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  campoChip: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  campoText: {
    fontSize: FontSize.xs,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  tipoBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  tipoBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipoBadgeNota: {
    fontSize: FontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  interpretacao: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  gridSingle: {},
  gridMulti: {
    rowGap: 0,
  },
  gridRow: {
    flexDirection: 'row',
    columnGap: Spacing.md,
  },
  gridCell: {
    flex: 1,
  },
});
