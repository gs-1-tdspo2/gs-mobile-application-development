import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import { TipoEstacaoLabels, StatusEstacaoLabels } from '@constants/enums';
import type { StatusEstacao, TipoEstacao } from '@constants/enums';
import type { EstacaoIot } from '@/types';

// ─── Status colors ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<StatusEstacao, { border: string; bg: string; fg: string }> = {
  ATIVA: { border: '#2E7D32', bg: '#E8F5E9', fg: '#1B5E20' },
  INATIVA: { border: '#757575', bg: '#F5F5F5', fg: '#424242' },
  MANUTENCAO: { border: '#E65100', bg: '#FFF3E0', fg: '#BF360C' },
  FALHA: { border: '#D32F2F', bg: '#FFEBEE', fg: '#B71C1C' },
  SEM_COM: { border: '#F57F17', bg: '#FFFDE7', fg: '#E65100' },
};

const TIPO_COLORS: Record<TipoEstacao, { bg: string; fg: string }> = {
  REAL: { bg: '#E3F2FD', fg: '#1565C0' },
  SIMULADA: { bg: '#F3E5F5', fg: '#6A1B9A' },
  REFERENCIA: { bg: '#E8F5E9', fg: '#1B5E20' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  estacao: EstacaoIot;
  regiaoNome?: string;
}

export function EstacaoCard({ estacao, regiaoNome }: Props) {
  const sc = STATUS_COLORS[estacao.statusEstacao] ?? STATUS_COLORS.INATIVA;
  const tc = TIPO_COLORS[estacao.tipoEstacao] ?? { bg: '#F5F5F5', fg: '#616161' };
  const hasCoords = estacao.latitude != null && estacao.longitude != null;

  return (
    <View style={[styles.root, { borderLeftColor: sc.border }]}>
      {/* Badge row */}
      <View style={styles.badgeRow}>
        <View style={[styles.tipoBadge, { backgroundColor: tc.bg }]}>
          <Text style={[styles.tipoBadgeText, { color: tc.fg }]}>
            {TipoEstacaoLabels[estacao.tipoEstacao] ?? estacao.tipoEstacao}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusBadgeText, { color: sc.fg }]}>
            {StatusEstacaoLabels[estacao.statusEstacao] ?? estacao.statusEstacao}
          </Text>
        </View>
      </View>

      {/* Name */}
      <Text style={styles.name} numberOfLines={2}>{estacao.nome}</Text>

      {/* Code */}
      <View style={styles.codeRow}>
        <Ionicons name="code-slash-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.code}>{estacao.codigoEstacao}</Text>
      </View>

      {/* Region */}
      {!!regiaoNome && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>{regiaoNome}</Text>
        </View>
      )}

      {/* Coords */}
      {hasCoords && (
        <View style={styles.infoRow}>
          <Ionicons name="navigate-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.infoText}>
            {Number(estacao.latitude).toFixed(4)}, {Number(estacao.longitude).toFixed(4)}
          </Text>
        </View>
      )}

      {/* Last communication */}
      {!!estacao.dtUltimaComunicacao && (
        <View style={styles.infoRow}>
          <Ionicons name="radio-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.infoText}>
            Última com.: {formatDate(estacao.dtUltimaComunicacao)}
          </Text>
        </View>
      )}

      {/* No communication */}
      {!estacao.dtUltimaComunicacao && (
        <View style={styles.infoRow}>
          <Ionicons name="radio-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.infoTextMuted}>Sem comunicação registrada</Text>
        </View>
      )}

      {/* Footer: station ID */}
      <Text style={styles.idLabel}>ID #{estacao.idEstacao}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  tipoBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  tipoBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginLeft: 'auto',
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  code: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    flex: 1,
  },
  infoTextMuted: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  idLabel: {
    fontSize: FontSize.xs,
    color: Colors.border,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
});
