import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegiao } from '@hooks/useRegiao';
import { useInativarRegiao } from '@hooks/useInativarRegiao';
import { useEstacoes } from '@hooks/useEstacoes';
import { useLeituras } from '@hooks/useLeituras';
import { useRiscoAtual } from '@hooks/useRiscoAtual';
import { useAlertas } from '@hooks/useAlertas';
import { usePolling } from '@hooks/usePolling';
import { useAppContext } from '@contexts/AppContext';
import { useToast } from '@contexts/ToastContext';
import { Colors, RiskColors, RiskBackgrounds } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import {
  TipoAreaLabels,
  VisibilidadeLabels,
  TipoEstacaoLabels,
  StatusEstacaoLabels,
  NivelRiscoLabels,
  CategoriaRiscoLabels,
  TipoAlertaLabels,
  StatusAlertaLabels,
} from '@constants/enums';
import type { StatusEstacao } from '@constants/enums';
import { SensorReadingSection } from '@components/charts';
import { extractSensorAnalysis } from '@utils/sensorTransforms';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function vulLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 75) return { label: 'Crítica',  color: RiskColors.CRITICO,  bg: RiskBackgrounds.CRITICO  };
  if (score >= 50) return { label: 'Alta',     color: RiskColors.ALTO,     bg: RiskBackgrounds.ALTO     };
  if (score >= 25) return { label: 'Moderada', color: RiskColors.MODERADO, bg: RiskBackgrounds.MODERADO };
  return              { label: 'Baixa',     color: RiskColors.BAIXO,    bg: RiskBackgrounds.BAIXO    };
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function statusAlertaColor(s: string): string {
  switch (s) {
    case 'ABERTO':     return '#B71C1C';
    case 'EM_ANALISE': return '#E65100';
    case 'RESOLVIDO':  return '#1B5E20';
    case 'CANCELADO':  return '#616161';
    default:           return Colors.textMuted;
  }
}

const STATION_STATUS_COLORS: Record<StatusEstacao, string> = {
  ATIVA:      '#2E7D32',
  INATIVA:    '#6B7280',
  MANUTENCAO: '#EF6C00',
  FALHA:      '#D32F2F',
  SEM_COM:    '#F9A825',
};

interface InfoRowProps { label: string; value: string }
function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DetalheRegiaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const regiaoId = parseInt(id, 10);
  const router = useRouter();
  const { isGoverno } = useAppContext();
  const { showToast } = useToast();
  const { status, data: regiao, errorMessage, load } = useRegiao();
  const { status: inativarStatus, execute: inativar } = useInativarRegiao();
  const { status: estStatus, data: estacoes, load: loadEst } = useEstacoes(isNaN(regiaoId) ? null : regiaoId);
  const { status: leitStatus, data: leituras, load: loadLeituras } = useLeituras(isNaN(regiaoId) ? null : regiaoId);
  const { status: riscoStatus, data: risco, load: loadRisco } = useRiscoAtual(isNaN(regiaoId) ? null : regiaoId);
  const { status: alertasStatus, data: allAlertas, load: loadAlertas } = useAlertas();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [confirmVisible, setConfirmVisible] = useState(false);

  // Region alertas filtered client-side
  const regionAlertas = useMemo(
    () => allAlertas.filter(a => a.idRegiao === regiaoId),
    [allAlertas, regiaoId],
  );

  // Sensor analysis from leituras
  const sensorAnalysis = useMemo(
    () => extractSensorAnalysis(leituras),
    [leituras],
  );

  // Load all data on focus
  useFocusEffect(
    useCallback(() => {
      if (!isNaN(regiaoId)) {
        load(regiaoId);
        loadEst();
        loadLeituras();
        loadRisco();
        loadAlertas();
      }
    }, [regiaoId, load, loadEst, loadLeituras, loadRisco, loadAlertas]),
  );

  // Live polling for telemetry + risk (not alertas — load on focus is enough)
  const pollData = useCallback(() => {
    if (!isNaN(regiaoId)) {
      loadEst({ silent: true });
      loadLeituras({ silent: true });
      loadRisco({ silent: true });
    }
  }, [regiaoId, loadEst, loadLeituras, loadRisco]);
  usePolling(pollData);

  const handleEditar = useCallback(() => {
    router.push(`/regioes/${regiaoId}/editar`);
  }, [router, regiaoId]);

  const handleInativarConfirm = useCallback(async () => {
    setConfirmVisible(false);
    const ok = await inativar(regiaoId);
    if (ok) {
      showToast('Região inativada com sucesso.');
      router.back();
    } else {
      showToast('Erro ao inativar região. Tente novamente.', 'error');
    }
  }, [inativar, regiaoId, router, showToast]);

  const isInativa = regiao?.stAtivo === 'N';
  const leitLoading = leitStatus === 'loading' || leitStatus === 'idle';

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: regiao?.nome ?? 'Detalhe da Região',
          headerRight: isGoverno
            ? () => (
                <TouchableOpacity onPress={handleEditar} style={styles.headerBtn}>
                  <Ionicons
                    name="create-outline"
                    size={22}
                    color={isDesktop ? Colors.text : Colors.card}
                  />
                </TouchableOpacity>
              )
            : undefined,
        }}
      />

      {status === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando região…</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.errorText}>{errorMessage ?? 'Erro ao carregar região.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(regiaoId)}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'success' && regiao && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
          showsVerticalScrollIndicator={false}
        >
          {/* Inactive banner */}
          {isInativa && (
            <View style={styles.inativaBanner}>
              <Ionicons name="pause-circle" size={18} color="#9E9E9E" />
              <Text style={styles.inativaBannerText}>Região inativa</Text>
            </View>
          )}

          {/* Vulnerability card */}
          {(() => {
            const vul = vulLevel(regiao.nivelVulnerabilidade);
            return (
              <View style={[styles.vulCard, { backgroundColor: vul.bg, borderLeftColor: vul.color }]}>
                <Text style={[styles.vulCardLabel, { color: vul.color }]}>
                  Vulnerabilidade {vul.label}
                </Text>
                <Text style={[styles.vulCardScore, { color: vul.color }]}>
                  {regiao.nivelVulnerabilidade}/100
                </Text>
              </View>
            );
          })()}

          {/* ── Risco Atual ──────────────────────────────────────────────────────── */}
          {riscoStatus === 'success' && risco && (
            <View style={[styles.riscoCard, {
              backgroundColor: RiskBackgrounds[risco.nivelRisco],
              borderLeftColor: RiskColors[risco.nivelRisco],
            }]}>
              <Text style={styles.riscoCardCaption}>Risco atual calculado</Text>
              <View style={styles.riscoValueRow}>
                <Text style={[styles.riscoValue, { color: RiskColors[risco.nivelRisco] }]}>
                  {NivelRiscoLabels[risco.nivelRisco]}
                </Text>
                {risco.tipoRisco && (
                  <View style={[styles.riscoPill, { backgroundColor: RiskColors[risco.nivelRisco] }]}>
                    <Text style={styles.riscoPillText}>{CategoriaRiscoLabels[risco.tipoRisco]}</Text>
                  </View>
                )}
              </View>
              {risco.scoreRisco != null && (
                <Text style={[styles.riscoScore, { color: RiskColors[risco.nivelRisco] }]}>
                  Score: {risco.scoreRisco}
                </Text>
              )}
              <Text style={styles.riscoTime}>Avaliado em {formatDate(risco.avaliadoEm)}</Text>
            </View>
          )}

          {/* ── Identificação ────────────────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Identificação</Text>
            <InfoRow label="Nome"           value={regiao.nome} />
            <InfoRow label="Tipo de área"   value={TipoAreaLabels[regiao.tipoArea]} />
            <InfoRow label="Visibilidade"   value={VisibilidadeLabels[regiao.tipoVisibilidade]} />
            {regiao.idCliente != null && (
              <InfoRow label="ID do cliente" value={String(regiao.idCliente)} />
            )}
          </View>

          {/* ── Local técnico ────────────────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Local técnico</Text>
            <InfoRow label="Cidade" value={regiao.cidade} />
            <InfoRow label="Estado" value={regiao.estado} />
            <View style={styles.coordRow}>
              <Text style={styles.infoLabel}>Coordenadas técnicas</Text>
              <View style={styles.coordRight}>
                <Text style={styles.coordValue}>
                  {regiao.latitude != null && regiao.longitude != null
                    ? `${regiao.latitude}, ${regiao.longitude}`
                    : '—'}
                </Text>
                <Text style={styles.coordHint}>
                  Usadas para integração climática e análise territorial.
                </Text>
              </View>
            </View>
          </View>

          {/* ── Telemetria IoT ───────────────────────────────────────────────────── */}
          {leitLoading && leituras.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Telemetria IoT</Text>
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.stationsLoadingText}>Carregando leituras…</Text>
              </View>
            </View>
          ) : leitStatus === 'error' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Telemetria IoT</Text>
              <Text style={styles.stationsEmpty}>Erro ao carregar leituras de sensores.</Text>
            </View>
          ) : leituras.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Telemetria IoT</Text>
              <Text style={styles.stationsEmpty}>Nenhuma leitura disponível para esta região.</Text>
            </View>
          ) : (
            <View style={styles.telemetrySection}>
              <Text style={styles.sectionHeaderText}>Telemetria IoT</Text>
              {sensorAnalysis.rangeLabel && (
                <Text style={styles.telRange}>
                  {sensorAnalysis.totalLeituras} {sensorAnalysis.totalLeituras === 1 ? 'leitura' : 'leituras'} · {sensorAnalysis.rangeLabel}
                </Text>
              )}
              <SensorReadingSection
                title="Nível de água"
                componente="HC-SR04"
                color="#1565C0"
                seriesMap={{
                  distancia: sensorAnalysis.agua.distancia,
                  nivel: sensorAnalysis.agua.nivel,
                }}
              />
              <SensorReadingSection
                title="Qualidade do ar"
                componente="Potenciômetro (sim. PMS5003)"
                color="#6A1B9A"
                seriesMap={{
                  pm25: sensorAnalysis.particulado.pm25,
                  pm10: sensorAnalysis.particulado.pm10,
                }}
              />
              <SensorReadingSection
                title="Pressão atmosférica"
                componente="BMP180"
                color="#00695C"
                seriesMap={{ pressao: sensorAnalysis.pressao }}
              />
              <SensorReadingSection
                title="Inclinação e vibração"
                componente="MPU6050"
                color="#BF360C"
                seriesMap={{
                  inclinacao: sensorAnalysis.movimento.inclinacao,
                  vibracao: sensorAnalysis.movimento.vibracao,
                }}
              />
            </View>
          )}

          {/* ── Alertas desta região ─────────────────────────────────────────────── */}
          {alertasStatus !== 'loading' && alertasStatus !== 'idle' && regionAlertas.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Alertas desta região · {regionAlertas.length}
              </Text>
              {regionAlertas.slice(0, 6).map(alerta => (
                <View key={alerta.idAlerta} style={styles.alertRow}>
                  <View style={styles.alertLeft}>
                    <View style={[
                      styles.alertStatusDot,
                      { backgroundColor: statusAlertaColor(alerta.statusAlerta) },
                    ]} />
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertTitle} numberOfLines={1}>{alerta.titulo}</Text>
                      <Text style={styles.alertMeta}>
                        {TipoAlertaLabels[alerta.tipoAlerta]} · {NivelRiscoLabels[alerta.nivelRisco]}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.alertStatusBadge, { backgroundColor: statusAlertaColor(alerta.statusAlerta) }]}>
                    <Text style={styles.alertStatusText}>
                      {StatusAlertaLabels[alerta.statusAlerta]}
                    </Text>
                  </View>
                </View>
              ))}
              {regionAlertas.length > 6 && (
                <Text style={styles.maisAlertas}>
                  + {regionAlertas.length - 6} alerta{regionAlertas.length - 6 !== 1 ? 's' : ''} — veja em Alertas
                </Text>
              )}
            </View>
          )}

          {/* ── Estações vinculadas ──────────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estações vinculadas</Text>

            {estStatus === 'loading' && (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.stationsLoadingText}>Carregando estações…</Text>
              </View>
            )}

            {(estStatus === 'idle' || estStatus === 'error') && (
              <Text style={styles.stationsEmpty}>Sem estações cadastradas para esta região.</Text>
            )}

            {estStatus === 'success' && estacoes.length === 0 && (
              <Text style={styles.stationsEmpty}>Sem estações cadastradas para esta região.</Text>
            )}

            {estStatus === 'success' && estacoes.length > 0 && estacoes.map(est => (
              <View key={est.idEstacao} style={styles.stationRow}>
                <View style={styles.stationInfo}>
                  <Text style={styles.stationCode}>{est.codigoEstacao}</Text>
                  <Text style={styles.stationName} numberOfLines={1}>{est.nome}</Text>
                  <Text style={styles.stationMeta}>
                    {TipoEstacaoLabels[est.tipoEstacao]}
                    {est.dtUltimaComunicacao
                      ? ` · Última com. ${formatDate(est.dtUltimaComunicacao)}`
                      : ''}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stationStatus,
                    { color: STATION_STATUS_COLORS[est.statusEstacao] ?? Colors.textMuted },
                  ]}
                >
                  {StatusEstacaoLabels[est.statusEstacao]}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Observações climáticas ───────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Observações climáticas</Text>
            <View style={styles.climaUnavail}>
              <Ionicons name="cloud-offline-outline" size={22} color={Colors.textMuted} />
              <Text style={styles.climaUnavailText}>
                Observações climáticas externas ainda não estão disponíveis pela API.
              </Text>
            </View>
          </View>

          {/* ── Metadados ────────────────────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Metadados</Text>
            <InfoRow label="Status"        value={isInativa ? 'Inativa' : 'Ativa'} />
            <InfoRow label="Criado em"     value={formatDate(regiao.dtCriadoEm)} />
            <InfoRow label="Atualizado em" value={formatDate(regiao.dtAtualizadoEm)} />
            <InfoRow label="ID da região"  value={String(regiao.idRegiao)} />
          </View>

          {/* ── Governo actions ───────────────────────────────────────────────────── */}
          {isGoverno && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={handleEditar} activeOpacity={0.8}>
                <Ionicons name="create-outline" size={18} color={Colors.card} />
                <Text style={styles.editBtnText}>Editar região</Text>
              </TouchableOpacity>

              {!isInativa && (
                <TouchableOpacity
                  style={[styles.inativarBtn, inativarStatus === 'loading' && styles.btnDisabled]}
                  onPress={() => setConfirmVisible(true)}
                  disabled={inativarStatus === 'loading'}
                  activeOpacity={0.8}
                >
                  {inativarStatus === 'loading' ? (
                    <ActivityIndicator color="#D32F2F" size="small" />
                  ) : (
                    <>
                      <Ionicons name="pause-circle-outline" size={18} color="#D32F2F" />
                      <Text style={styles.inativarBtnText}>Inativar região</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Cross-platform inativar confirmation modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Ionicons name="pause-circle" size={32} color="#D32F2F" style={styles.dialogIcon} />
            <Text style={styles.dialogTitle}>Inativar Região</Text>
            <Text style={styles.dialogBody}>
              Tem certeza que deseja inativar esta região monitorada?{'\n'}
              Esta ação pode ser revertida pelo administrador.
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnCancel]}
                onPress={() => setConfirmVisible(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.dialogBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnConfirm]}
                onPress={handleInativarConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogBtnConfirmText}>Inativar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  contentDesktop: {
    paddingHorizontal: Spacing.xl,
  },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, padding: Spacing.xl,
  },
  loadingText: { fontSize: FontSize.md, color: Colors.textMuted },
  errorText:   { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center' },
  retryBtn: {
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md, backgroundColor: Colors.primary,
  },
  retryBtnText: { fontSize: FontSize.md, color: Colors.card, fontWeight: '600' },

  headerBtn: { paddingHorizontal: Spacing.sm },

  inativaBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#F5F5F5', borderRadius: Radius.sm, padding: Spacing.md,
  },
  inativaBannerText: { fontSize: FontSize.sm, color: '#757575', fontWeight: '600' },

  vulCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: Radius.md, borderLeftWidth: 4, padding: Spacing.md,
  },
  vulCardLabel: { fontSize: FontSize.md, fontWeight: '700' },
  vulCardScore: { fontSize: FontSize.xl, fontWeight: '800' },

  // Risco atual
  riscoCard: {
    borderRadius: Radius.md, borderLeftWidth: 4, padding: Spacing.md, gap: 4,
  },
  riscoCardCaption: {
    fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  riscoValueRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap',
  },
  riscoValue: { fontSize: FontSize.xxl, fontWeight: '800', letterSpacing: -0.5 },
  riscoPill: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  riscoPillText: { fontSize: FontSize.xs, fontWeight: '700', color: '#FFFFFF' },
  riscoScore: { fontSize: FontSize.sm, fontWeight: '600' },
  riscoTime:  { fontSize: FontSize.xs, color: Colors.textMuted },

  card: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm, ...Shadow.sm,
  },
  cardTitle: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.background,
  },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
  infoValue: {
    fontSize: FontSize.sm, fontWeight: '600', color: Colors.text,
    flex: 1, textAlign: 'right',
  },

  coordRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 4,
  },
  coordRight: { flex: 1, alignItems: 'flex-end', gap: 2 },
  coordValue: {
    fontSize: FontSize.sm, fontWeight: '600', color: Colors.text,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  coordHint: {
    fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', lineHeight: 14,
  },

  inlineLoading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stationsLoadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  stationsEmpty: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic' },

  // Telemetry section wrapper
  telemetrySection: { gap: Spacing.sm },
  sectionHeaderText: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, letterSpacing: -0.2,
  },
  telRange: {
    fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs,
  },

  // Alert rows
  alertRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.background,
    gap: Spacing.sm,
  },
  alertLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  alertStatusDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  alertInfo: { flex: 1, gap: 2 },
  alertTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  alertMeta:  { fontSize: FontSize.xs, color: Colors.textMuted },
  alertStatusBadge: {
    paddingHorizontal: Spacing.xs, paddingVertical: 2,
    borderRadius: Radius.sm, flexShrink: 0,
  },
  alertStatusText: { fontSize: FontSize.xs, fontWeight: '700', color: '#FFFFFF' },
  maisAlertas: {
    fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic',
    textAlign: 'center', paddingTop: Spacing.xs,
  },

  // Stations
  stationRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.background,
    gap: Spacing.sm,
  },
  stationInfo: { flex: 1, gap: 2 },
  stationCode: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary, letterSpacing: 0.3 },
  stationName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  stationMeta: { fontSize: FontSize.xs, color: Colors.textMuted },
  stationStatus: { fontSize: FontSize.xs, fontWeight: '700' },

  // Climate unavailable
  climaUnavail: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  climaUnavailText: {
    fontSize: FontSize.sm, color: Colors.textMuted, flex: 1,
    lineHeight: 19, fontStyle: 'italic',
  },

  // Actions
  actions: { gap: Spacing.sm },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: Radius.md, paddingVertical: Spacing.md, ...Shadow.sm,
  },
  editBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.card },
  inativarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderRadius: Radius.md, paddingVertical: Spacing.md,
    borderWidth: 1.5, borderColor: '#D32F2F', backgroundColor: '#FFF8F8',
  },
  inativarBtnText: { fontSize: FontSize.md, fontWeight: '700', color: '#D32F2F' },
  btnDisabled: { opacity: 0.5 },

  // Confirmation modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xl,
  },
  dialog: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.xl, width: '100%', maxWidth: 400,
    alignItems: 'center', gap: Spacing.sm, ...Shadow.md,
  },
  dialogIcon:           { marginBottom: Spacing.xs },
  dialogTitle:          { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  dialogBody:           { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.sm },
  dialogActions:        { flexDirection: 'row', gap: Spacing.sm, width: '100%', marginTop: Spacing.xs },
  dialogBtn:            { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  dialogBtnCancel:      { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  dialogBtnCancelText:  { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  dialogBtnConfirm:     { backgroundColor: '#D32F2F' },
  dialogBtnConfirmText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
});
