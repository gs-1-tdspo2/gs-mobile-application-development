import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppShell } from '@/components/AppShell';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartLegend, LegendItem } from '@/components/charts/ChartLegend';
import { DonutChart, DonutSlice } from '@/components/charts/DonutChart';
import { HBarItem, HorizontalBarChart } from '@/components/charts/HorizontalBarChart';
import { VBarItem, VerticalBarChart } from '@/components/charts/VerticalBarChart';
import { getAlertas } from '@/services/alertasService';
import { getDashboardSummary } from '@/services/dashboardService';
import { listarIndicadoresRegionais } from '@/services/indicadoresService';
import { getRegioes } from '@/services/regioesService';
import { AlertaReadModel } from '@/types/alerta';
import { DashboardSummary } from '@/types/dashboard';
import { IndicadorRegional } from '@/types/indicador';
import { RegiaoReadModel } from '@/types/regiao';
import { getApiErrorMessage } from '@/utils/apiError';
import { useResponsiveLayout } from '@/utils/responsive';

/* ── Palette ─────────────────────────────────────────── */
const C = {
  critico:  '#D32F2F',
  alto:     '#EF6C00',
  moderado: '#F9A825',
  baixo:    '#2E7D32',
  primary:  '#3F51B5',
  teal:     '#009688',
  brown:    '#8D6E63',
  steel:    '#607D8B',
  purple:   '#7B1FA2',
  blue2:    '#1565C0',
  cyan:     '#0097A7',
  muted:    '#6B7280',
  border:   '#DDE2EA',
};

/* ── Static content ──────────────────────────────────── */
const SENSOR_DIMS = [
  { risco: 'Enchente',       sensores: 'Nível de água · ultrassônico', color: C.blue2   },
  { risco: 'Deslizamento',   sensores: 'Inclinação · vibração',        color: C.brown   },
  { risco: 'Tempestade',     sensores: 'Pressão atmosférica',          color: C.steel   },
  { risco: 'Qualidade do Ar', sensores: 'PM2.5 · PM10',                color: C.purple  },
];

const RISK_ORDER: Record<string, number> = { CRITICO: 0, ALTO: 1, MODERADO: 2, BAIXO: 3 };

/* ── Helpers ─────────────────────────────────────────── */

function fmt(v?: number | null): string {
  return v === undefined || v === null ? '—' : v.toLocaleString('pt-BR');
}

function fmtTime(ts?: string): string | null {
  if (!ts) return null;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return null;
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch { return null; }
}

function riskColor(nivel?: string): string {
  if (nivel === 'CRITICO')  return C.critico;
  if (nivel === 'ALTO')     return C.alto;
  if (nivel === 'MODERADO') return C.moderado;
  if (nivel === 'BAIXO')    return C.baixo;
  return C.primary;
}

function vulnColor(score: number): string {
  if (score >= 75) return C.critico;
  if (score >= 50) return C.alto;
  if (score >= 25) return C.moderado;
  return C.baixo;
}

function tipoRiscoLabel(t: string): string {
  const map: Record<string, string> = {
    ENCHENTE:     'Enchente',
    DESLIZAMENTO: 'Desliz.',
    TEMPESTADE:   'Tempest.',
    QUALIDADE_AR: 'Qual. Ar',
    SECA:         'Seca',
    GRANIZO:      'Granizo',
  };
  return map[t] ?? t.replace(/_/g, ' ').slice(0, 10);
}

function tipoRiscoColor(t: string): string {
  const map: Record<string, string> = {
    ENCHENTE:     C.blue2,
    DESLIZAMENTO: C.brown,
    TEMPESTADE:   C.steel,
    QUALIDADE_AR: C.purple,
    SECA:         C.alto,
    GRANIZO:      C.cyan,
  };
  return map[t] ?? C.primary;
}

function tipoAreaLabel(t: string): string {
  const map: Record<string, string> = {
    AREA_URBANA:         'Área Urbana',
    REGIAO_RIBEIRINHA:   'Ribeirinha',
    ENCOSTA:             'Encosta',
    AREA_RURAL:          'Área Rural',
    COMUNIDADE:          'Comunidade',
    PONTE:               'Ponte',
    PROPRIEDADE_PRIVADA: 'Prop. Privada',
    OUTRA:               'Outra',
  };
  return map[t] ?? t.replace(/_/g, ' ');
}

function statusAlertaColor(s: string): string {
  const n = s.toUpperCase();
  if (n.includes('RESOLV'))                          return C.baixo;
  if (n.includes('ANALISE') || n.includes('PROC'))  return C.moderado;
  if (n.includes('ABERTO') || n.includes('ATIVO'))  return C.alto;
  if (n.includes('CRITICO'))                         return C.critico;
  return C.muted;
}

function nivelRiscoNorm(v?: string): string {
  return v?.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase() ?? '';
}

/* ── Types ───────────────────────────────────────────── */

type CoverageRow = {
  id: string | number;
  nome: string;
  cidade?: string;
  estado?: string;
  tipoArea?: string;
  nivelVulnerabilidade?: number;
  nivelRisco?: string;
  scoreMedio?: number;
  quantidadeEstacoes?: number;
  quantidadeAlertasAtivos?: number;
};

/* ── Data derivations ────────────────────────────────── */

function deriveRiskDist(indicadores: IndicadorRegional[]): DonutSlice[] {
  const counts: Record<string, number> = { CRITICO: 0, ALTO: 0, MODERADO: 0, BAIXO: 0 };
  indicadores.forEach((ind) => {
    const n = nivelRiscoNorm(ind.nivelRiscoMedio);
    if (n in counts) counts[n]++;
  });
  return [
    { label: 'Crítico',  value: counts.CRITICO,  color: C.critico  },
    { label: 'Alto',     value: counts.ALTO,     color: C.alto     },
    { label: 'Moderado', value: counts.MODERADO, color: C.moderado },
    { label: 'Baixo',    value: counts.BAIXO,    color: C.baixo    },
  ];
}

function deriveTipoDist(indicadores: IndicadorRegional[]): VBarItem[] {
  const counts: Record<string, number> = {};
  indicadores.forEach((ind) => {
    if (!ind.tipoRisco) return;
    counts[ind.tipoRisco] = (counts[ind.tipoRisco] ?? 0) + 1;
  });
  return Object.entries(counts)
    .map(([k, v]) => ({ label: tipoRiscoLabel(k), value: v, color: tipoRiscoColor(k) }))
    .sort((a, b) => b.value - a.value);
}

function deriveRegionalRanking(indicadores: IndicadorRegional[]): HBarItem[] {
  const best: Record<string, { nome: string; score: number; nivel: string }> = {};
  indicadores.forEach((ind) => {
    if (!ind.nomeRegiao || ind.idRegiao === null || ind.idRegiao === undefined) return;
    const key   = String(ind.idRegiao);
    const score = ind.scoreMedio ?? 0;
    if (!best[key] || score > best[key].score) {
      best[key] = { nome: ind.nomeRegiao, score, nivel: nivelRiscoNorm(ind.nivelRiscoMedio) };
    }
  });
  return Object.values(best)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((r) => ({ label: r.nome, value: Math.round(r.score), color: riskColor(r.nivel), subLabel: r.nivel || undefined }));
}

function deriveAlertStatusDist(alertas: AlertaReadModel[]): HBarItem[] {
  const counts: Record<string, number> = {};
  alertas.forEach((a) => {
    const s = a.status ?? 'DESCONHECIDO';
    counts[s] = (counts[s] ?? 0) + 1;
  });
  return Object.entries(counts)
    .map(([k, v]) => ({ label: k, value: v, color: statusAlertaColor(k) }))
    .sort((a, b) => b.value - a.value);
}

function deriveAlertNivelDist(alertas: AlertaReadModel[]): DonutSlice[] {
  const counts: Record<string, number> = { CRITICO: 0, ALTO: 0, MODERADO: 0, BAIXO: 0 };
  alertas.forEach((a) => {
    const n = nivelRiscoNorm(a.nivel);
    if (n in counts) counts[n]++;
  });
  return [
    { label: 'Crítico',  value: counts.CRITICO,  color: C.critico  },
    { label: 'Alto',     value: counts.ALTO,     color: C.alto     },
    { label: 'Moderado', value: counts.MODERADO, color: C.moderado },
    { label: 'Baixo',    value: counts.BAIXO,    color: C.baixo    },
  ];
}

function deriveTipoAreaDist(regioes: RegiaoReadModel[]): VBarItem[] {
  const counts: Record<string, number> = {};
  regioes.forEach((r) => {
    const t = typeof r.raw?.tipoArea === 'string' ? r.raw.tipoArea : null;
    if (!t) return;
    counts[t] = (counts[t] ?? 0) + 1;
  });
  return Object.entries(counts)
    .map(([k, v]) => ({ label: tipoAreaLabel(k), value: v, color: C.primary }))
    .sort((a, b) => b.value - a.value);
}

function deriveCoverageBoard(
  regioes: RegiaoReadModel[],
  indicadores: IndicadorRegional[],
): CoverageRow[] {
  return regioes
    .map((r) => {
      const matched = indicadores.filter((ind) => {
        if (ind.idRegiao !== null && ind.idRegiao !== undefined) {
          return String(ind.idRegiao) === String(r.id);
        }
        return ind.nomeRegiao?.toLowerCase() === r.nome?.toLowerCase();
      });
      const best    = matched.sort((a, b) => (b.scoreMedio ?? 0) - (a.scoreMedio ?? 0))[0];
      const nRisco  = best ? nivelRiscoNorm(best.nivelRiscoMedio) : undefined;
      return {
        id:                      r.id,
        nome:                    r.nome,
        cidade:                  r.cidade,
        estado:                  r.estado,
        tipoArea:                typeof r.raw?.tipoArea === 'string' ? r.raw.tipoArea : undefined,
        nivelVulnerabilidade:    typeof r.raw?.nivelVulnerabilidade === 'number' ? r.raw.nivelVulnerabilidade : undefined,
        nivelRisco:              nRisco || undefined,
        scoreMedio:              best?.scoreMedio,
        quantidadeEstacoes:      best?.quantidadeEstacoes,
        quantidadeAlertasAtivos: best?.quantidadeAlertasAtivos,
      };
    })
    .sort((a, b) => {
      const ra = RISK_ORDER[a.nivelRisco ?? ''] ?? 4;
      const rb = RISK_ORDER[b.nivelRisco ?? ''] ?? 4;
      if (ra !== rb) return ra - rb;
      return (b.nivelVulnerabilidade ?? 0) - (a.nivelVulnerabilidade ?? 0);
    });
}

/* ── Screen ──────────────────────────────────────────── */

export default function HomeScreen() {
  const [summary, setSummary]         = useState<DashboardSummary | null>(null);
  const [indicadores, setIndicadores] = useState<IndicadorRegional[]>([]);
  const [alertas, setAlertas]         = useState<AlertaReadModel[]>([]);
  const [regioes, setRegioes]         = useState<RegiaoReadModel[]>([]);

  const [summaryLoading,   setSummaryLoading]   = useState(true);
  const [indicadoresLoad,  setIndicadoresLoad]  = useState(true);
  const [alertasLoad,      setAlertasLoad]      = useState(true);
  const [regioesLoad,      setRegioesLoad]      = useState(true);

  const [summaryError,    setSummaryError]    = useState<string | null>(null);
  const [indicadoresError, setIndicadoresError] = useState<string | null>(null);
  const [alertasError,    setAlertasError]    = useState<string | null>(null);
  const [regioesError,    setRegioesError]    = useState<string | null>(null);

  const { isDesktop } = useResponsiveLayout();

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true); setSummaryError(null);
    try   { setSummary(await getDashboardSummary()); }
    catch (e) { setSummary(null); setSummaryError(getApiErrorMessage(e)); }
    finally   { setSummaryLoading(false); }
  }, []);

  const loadIndicadores = useCallback(async () => {
    setIndicadoresLoad(true); setIndicadoresError(null);
    try   { setIndicadores(await listarIndicadoresRegionais()); }
    catch (e) { setIndicadores([]); setIndicadoresError(getApiErrorMessage(e)); }
    finally   { setIndicadoresLoad(false); }
  }, []);

  const loadAlertas = useCallback(async () => {
    setAlertasLoad(true); setAlertasError(null);
    try   { setAlertas(await getAlertas()); }
    catch (e) { setAlertas([]); setAlertasError(getApiErrorMessage(e)); }
    finally   { setAlertasLoad(false); }
  }, []);

  const loadRegioes = useCallback(async () => {
    setRegioesLoad(true); setRegioesError(null);
    try   { setRegioes(await getRegioes()); }
    catch (e) { setRegioes([]); setRegioesError(getApiErrorMessage(e)); }
    finally   { setRegioesLoad(false); }
  }, []);

  const refresh = useCallback(() => {
    void loadSummary();
    void loadIndicadores();
    void loadAlertas();
    void loadRegioes();
  }, [loadSummary, loadIndicadores, loadAlertas, loadRegioes]);

  useEffect(() => { refresh(); }, [refresh]);

  /* ── Derived data ─────────────────────────────────── */

  const riskDist         = useMemo(() => deriveRiskDist(indicadores),       [indicadores]);
  const tipoDist         = useMemo(() => deriveTipoDist(indicadores),        [indicadores]);
  const regRanking       = useMemo(() => deriveRegionalRanking(indicadores), [indicadores]);
  const alertStatus      = useMemo(() => deriveAlertStatusDist(alertas),     [alertas]);
  const alertNivel       = useMemo(() => deriveAlertNivelDist(alertas),      [alertas]);
  const tipoAreaDist     = useMemo(() => deriveTipoAreaDist(regioes),        [regioes]);
  const coverageRows     = useMemo(() => deriveCoverageBoard(regioes, indicadores), [regioes, indicadores]);

  const recentCritical   = useMemo(() =>
    alertas
      .filter((a) => a.nivel === 'CRITICO' || a.nivel === 'ALTO')
      .sort((a, b) => (b.criadoEm ? new Date(b.criadoEm).getTime() : 0) - (a.criadoEm ? new Date(a.criadoEm).getTime() : 0))
      .slice(0, 5),
  [alertas]);

  const riskLegend: LegendItem[]        = useMemo(() => riskDist.map(s => ({ label: s.label, value: s.value, color: s.color })),  [riskDist]);
  const alertNivelLegend: LegendItem[]  = useMemo(() => alertNivel.map(s => ({ label: s.label, value: s.value, color: s.color })), [alertNivel]);
  const rankingData = useMemo(() => isDesktop ? regRanking : regRanking.slice(0, 5), [regRanking, isDesktop]);

  const insights = useMemo(() => {
    const result: string[] = [];
    if (indicadores.length > 0) {
      const critCount = indicadores.filter(i => nivelRiscoNorm(i.nivelRiscoMedio) === 'CRITICO').length;
      if (critCount > 0) {
        result.push(`${critCount} ${critCount === 1 ? 'região aparece' : 'regiões aparecem'} em nível CRÍTICO nos indicadores regionais.`);
      }
      const tipoCounts: Record<string, number> = {};
      indicadores.forEach(i => { if (i.tipoRisco) tipoCounts[i.tipoRisco] = (tipoCounts[i.tipoRisco] ?? 0) + 1; });
      const topTipo = Object.entries(tipoCounts).sort((a, b) => b[1] - a[1])[0];
      if (topTipo && topTipo[1] > 1) {
        result.push(`Tipo de risco mais frequente: ${tipoRiscoLabel(topTipo[0])} (${topTipo[1]} indicadores).`);
      }
    }
    if (summary && (summary.alertasAtivos ?? 0) > 0) {
      const crit = summary.alertasCriticos ?? 0;
      result.push(`${fmt(summary.alertasAtivos)} alertas ativos${crit > 0 ? `, sendo ${crit} críticos` : ''}.`);
    }
    return result.slice(0, 2);
  }, [indicadores, summary]);

  const totalStationsInIndicators = useMemo(() => indicadores.reduce((s, i) => s + (i.quantidadeEstacoes ?? 0), 0), [indicadores]);
  const totalAlertsInIndicators   = useMemo(() => indicadores.reduce((s, i) => s + (i.quantidadeAlertasAtivos ?? 0), 0), [indicadores]);

  const isRefreshing = summaryLoading || indicadoresLoad || alertasLoad || regioesLoad;
  const row          = isDesktop ? s.rowD : s.rowM;

  return (
    <AppShell activeRoute="dashboard">
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={[s.scroll, isDesktop && s.scrollD]}>

          {/* ─── Header ───────────────────────────────── */}
          <View style={[s.header, isDesktop && s.headerRow]}>
            <Text style={s.pageTitle}>Dashboard</Text>
            <Pressable
              onPress={refresh}
              disabled={isRefreshing}
              style={({ hovered }) => [s.refreshBtn, hovered && s.refreshBtnHov, isRefreshing && s.refreshBtnDis]}>
              <Text style={s.refreshBtnTxt}>{isRefreshing ? 'Carregando...' : 'Atualizar'}</Text>
            </Pressable>
          </View>

          {/* ═══════════════════════════════════════════ */}
          {/* ZONA A — SITUAÇÃO ATUAL                     */}
          {/* ═══════════════════════════════════════════ */}
          <ZoneHeader title="SITUAÇÃO ATUAL" />

          {summaryLoading ? (
            <View style={s.loadCard}><Text style={s.loadTxt}>Carregando dados operacionais...</Text></View>
          ) : summaryError ? (
            <View style={s.errCard}>
              <Text style={s.errTitle}>Falha ao conectar</Text>
              <Text style={s.errDetail}>{summaryError}</Text>
            </View>
          ) : summary ? (
            <>
              <OperationalPanel summary={summary} isDesktop={isDesktop} />
              {insights.length > 0 ? <InsightStrip insights={insights} isDesktop={isDesktop} /> : null}
              <View style={s.kpiGrid}>
                <KpiChip label="Regiões"    value={fmt(summary.totalRegioes)}          accent={C.primary} />
                <KpiChip label="Estações"   value={fmt(summary.totalEstacoesAtivas)}   accent={C.teal} />
                <KpiChip label="Alertas"    value={fmt(summary.alertasAtivos)}          accent={C.alto} />
                <KpiChip label="Leituras"   value={fmt(summary.leiturasValidas)}        accent={C.primary} />
                <KpiChip label="Obs. Clim." value={fmt(summary.observacoesClimaticas)} accent={C.teal} />
                <KpiChip label="Av. Risco"  value={fmt(summary.avaliacoesRisco)}        accent={C.moderado} />
              </View>
            </>
          ) : null}

          {/* ═══════════════════════════════════════════ */}
          {/* ZONA B — INTELIGÊNCIA DE RISCO              */}
          {/* ═══════════════════════════════════════════ */}
          <ZoneHeader
            title="INTELIGÊNCIA DE RISCO"
            badge={indicadoresLoad ? 'carregando' : indicadoresError ? 'erro' : `${indicadores.length} indicadores`}
          />

          {!indicadoresLoad && !indicadoresError ? (
            <View style={row}>
              <ChartCard title="Distribuição de Risco" subtitle="Por nível nos indicadores regionais" style={s.flex1}>
                <View style={s.donutRow}>
                  <DonutChart data={riskDist} size={isDesktop ? 130 : 110} thickness={26} centerLabel="total" centerValue={indicadores.length} />
                  <ChartLegend items={riskLegend} />
                </View>
              </ChartCard>
              <ChartCard title="Tipo de Risco" subtitle="Categoria de perigo monitorada" style={s.flex1}>
                <VerticalBarChart data={tipoDist} maxBarHeight={80} />
              </ChartCard>
              <ChartCard title="Score Regional" subtitle={`Ranking por score máximo${!isDesktop ? ' · top 5' : ''}`} style={s.flex2}>
                <HorizontalBarChart data={rankingData} labelWidth={isDesktop ? 120 : 90} />
              </ChartCard>
            </View>
          ) : indicadoresError ? (
            <PartialError msg={indicadoresError} />
          ) : null}

          {/* ═══════════════════════════════════════════ */}
          {/* ZONA C — RESPOSTA OPERACIONAL               */}
          {/* ═══════════════════════════════════════════ */}
          <ZoneHeader
            title="RESPOSTA OPERACIONAL"
            badge={alertasLoad ? 'carregando' : alertasError ? 'erro' : `${alertas.length} alertas`}
          />

          {!alertasLoad && !alertasError ? (
            <>
              <View style={row}>
                <ChartCard title="Severidade dos Alertas" subtitle="Distribuição por nível de risco" style={s.flex1}>
                  <View style={s.donutRow}>
                    <DonutChart data={alertNivel} size={isDesktop ? 120 : 100} thickness={24} centerLabel="total" centerValue={alertas.length} />
                    <ChartLegend items={alertNivelLegend} compact />
                  </View>
                </ChartCard>
                <ChartCard title="Estado dos Alertas" subtitle="Distribuição por status operacional" style={s.flex2}>
                  <HorizontalBarChart data={alertStatus} labelWidth={isDesktop ? 110 : 80} />
                </ChartCard>
              </View>
              <ChartCard title="Alertas Críticos e Altos" subtitle="Eventos prioritários recentes">
                {recentCritical.length === 0 ? (
                  <Text style={s.noData}>Nenhum alerta crítico ou alto ativo.</Text>
                ) : (
                  <View>
                    {recentCritical.map((a, i) => (
                      <AlertRow key={String(a.id)} alerta={a} last={i === recentCritical.length - 1} />
                    ))}
                  </View>
                )}
              </ChartCard>
            </>
          ) : alertasError ? (
            <PartialError msg={alertasError} />
          ) : null}

          {/* ═══════════════════════════════════════════ */}
          {/* ZONA D — COBERTURA IOT E DADOS              */}
          {/* ═══════════════════════════════════════════ */}
          <ZoneHeader
            title="COBERTURA IOT E DADOS"
            badge={regioesLoad ? 'carregando' : regioesError ? 'erro' : `${regioes.length} regiões`}
          />

          {/* Sensor network + coverage counts */}
          <View style={row}>
            <ChartCard title="Rede de Sensores e Dados" subtitle="Totais consolidados da plataforma" style={s.flex1}>
              <View style={s.sensorStats}>
                <SensorStat label="Estações ativas"      value={fmt(summary?.totalEstacoesAtivas)}   color={C.teal} />
                <SensorStat label="Leituras válidas"      value={fmt(summary?.leiturasValidas)}        color={C.primary} />
                <SensorStat label="Observações climáticas" value={fmt(summary?.observacoesClimaticas)} color={C.primary} />
                <SensorStat label="Avaliações de risco"   value={fmt(summary?.avaliacoesRisco)}        color={C.moderado} />
                <SensorStat label="Estações (indicadores)" value={fmt(totalStationsInIndicators)}     color={C.teal} />
                <SensorStat label="Alertas (indicadores)"  value={fmt(totalAlertsInIndicators)}       color={C.alto} />
              </View>
            </ChartCard>
            <ChartCard title="Dimensões Monitoradas" subtitle="Tipos de risco e sensores correspondentes" style={s.flex1}>
              <View style={s.dimList}>
                {SENSOR_DIMS.map((d) => (
                  <View key={d.risco} style={s.dimRow}>
                    <View style={[s.dimDot, { backgroundColor: d.color }]} />
                    <Text style={[s.dimRisco, { color: d.color }]}>{d.risco}</Text>
                    <Text style={s.dimSensores}>{d.sensores}</Text>
                  </View>
                ))}
                <Text style={s.dimDisclaimer}>
                  Capacidade técnica dos sensores Amanajé. Contagem real disponível via leituras.
                </Text>
              </View>
            </ChartCard>
          </View>

          {/* Tipo de área distribution */}
          {tipoAreaDist.length > 0 ? (
            <ChartCard title="Distribuição por Tipo de Área" subtitle="Classificação das regiões monitoradas">
              <VerticalBarChart data={tipoAreaDist} maxBarHeight={80} />
            </ChartCard>
          ) : null}

          {/* Deployment board */}
          <ChartCard
            title="Cobertura Operacional"
            subtitle="Regiões monitoradas · nível de risco e vulnerabilidade cadastrada">
            {regioesLoad ? (
              <Text style={s.noData}>Carregando regiões...</Text>
            ) : regioesError ? (
              <Text style={s.errDetail}>{regioesError}</Text>
            ) : coverageRows.length === 0 ? (
              <Text style={s.noData}>Nenhuma região cadastrada.</Text>
            ) : (
              <CoverageBoard rows={coverageRows} isDesktop={isDesktop} />
            )}
          </ChartCard>

          {/* Action shortcuts */}
          <ActionShortcuts />

        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function ZoneHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <View style={zh.root}>
      <View style={zh.bar} />
      <Text style={zh.title}>{title}</Text>
      {badge ? <View style={zh.pill}><Text style={zh.pillTxt}>{badge}</Text></View> : null}
    </View>
  );
}

function OperationalPanel({ summary, isDesktop }: { summary: DashboardSummary; isDesktop: boolean }) {
  const risco    = summary.maiorRiscoAtual;
  const riscoCol = riskColor(risco);
  const ts       = fmtTime(summary.atualizadoEm);
  return (
    <View style={[op.panel, { borderLeftColor: riscoCol }]}>
      <View style={op.header}>
        <Text style={op.sectionLabel}>SITUAÇÃO OPERACIONAL</Text>
        {ts ? <Text style={op.ts}>Atualizado: {ts}</Text> : null}
      </View>
      <View style={[op.body, isDesktop && op.bodyD]}>
        <View style={op.riskBox}>
          <Text style={op.riskSub}>RISCO ATUAL</Text>
          <View style={[op.riskPill, { backgroundColor: riscoCol + '20', borderColor: riscoCol }]}>
            <Text style={[op.riskVal, { color: riscoCol }]}>{risco ?? '—'}</Text>
          </View>
        </View>
        <View style={[op.divider, isDesktop && op.dividerV]} />
        <View style={[op.statsRow, isDesktop && op.statsRowD]}>
          <OpsStat value={fmt(summary.regioesComRiscoAltoOuCritico)} label="regiões alto/crít." />
          <OpsStat value={fmt(summary.alertasCriticos)}              label="alertas críticos"   color={C.critico} />
          <OpsStat value={fmt(summary.alertasAtivos)}                label="alertas ativos"     color={C.alto} />
          <OpsStat value={fmt(summary.totalEstacoesAtivas)}          label="estações ativas"    color={C.teal} />
        </View>
      </View>
    </View>
  );
}

function OpsStat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <View style={op.stat}>
      <Text style={[op.statVal, color ? { color } : null]}>{value}</Text>
      <Text style={op.statLabel}>{label}</Text>
    </View>
  );
}

function InsightStrip({ insights, isDesktop }: { insights: string[]; isDesktop: boolean }) {
  return (
    <View style={[ins.root, isDesktop && ins.rootD]}>
      {insights.map((text, i) => (
        <View key={i} style={[ins.card, isDesktop && ins.cardD]}>
          <View style={ins.marker} />
          <Text style={ins.text}>{text}</Text>
        </View>
      ))}
    </View>
  );
}

function KpiChip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={kc.chip}>
      <Text style={kc.val}>{value}</Text>
      <Text style={[kc.lbl, { color: accent }]}>{label}</Text>
    </View>
  );
}

function SensorStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={ss.row}>
      <Text style={ss.label}>{label}</Text>
      <Text style={[ss.value, { color }]}>{value}</Text>
    </View>
  );
}

function PartialError({ msg }: { msg: string }) {
  return (
    <View style={s.partialErr}>
      <Text style={s.partialErrTxt}>Não foi possível carregar este painel: {msg}</Text>
    </View>
  );
}

function AlertRow({ alerta, last }: { alerta: AlertaReadModel; last: boolean }) {
  const col = riskColor(alerta.nivel);
  return (
    <View style={[al.row, !last && al.rowBorder]}>
      <View style={[al.dot, { backgroundColor: col }]} />
      <View style={al.content}>
        <Text style={al.titulo} numberOfLines={1}>{alerta.titulo}</Text>
        {alerta.regiaoNome ? <Text style={al.sub}>{alerta.regiaoNome}</Text> : null}
      </View>
      <View style={[al.badge, { backgroundColor: col + '22', borderColor: col }]}>
        <Text style={[al.badgeTxt, { color: col }]}>{alerta.nivel ?? '—'}</Text>
      </View>
    </View>
  );
}

function CoverageBoard({ rows, isDesktop }: { rows: CoverageRow[]; isDesktop: boolean }) {
  return (
    <View style={cb.root}>
      {isDesktop ? (
        <View style={cb.thead}>
          <Text style={[cb.th, cb.cUf]}>UF</Text>
          <Text style={[cb.th, cb.cNome]}>REGIÃO</Text>
          <Text style={[cb.th, cb.cTipo]}>TIPO</Text>
          <Text style={[cb.th, cb.cVuln]}>VULN.</Text>
          <Text style={[cb.th, cb.cRisco]}>RISCO</Text>
          <Text style={[cb.th, cb.cEst]}>EST.</Text>
          <Text style={[cb.th, cb.cAl]}>ALERTAS</Text>
        </View>
      ) : null}
      {rows.map((row) =>
        isDesktop ? (
          <DesktopCoverageRow key={String(row.id)} row={row} />
        ) : (
          <MobileCoverageCard key={String(row.id)} row={row} />
        ),
      )}
    </View>
  );
}

function DesktopCoverageRow({ row }: { row: CoverageRow }) {
  const rc  = row.nivelRisco ? riskColor(row.nivelRisco) : null;
  const vc  = row.nivelVulnerabilidade !== undefined ? vulnColor(row.nivelVulnerabilidade) : null;
  return (
    <View style={cb.trow}>
      <Text style={[cb.cell, cb.cUf]}>{row.estado ?? '—'}</Text>
      <View style={cb.cNome}>
        <Text style={cb.rowNome} numberOfLines={1}>{row.nome}</Text>
        {row.cidade ? <Text style={cb.rowSub}>{row.cidade}</Text> : null}
      </View>
      <Text style={[cb.cell, cb.cTipo]}>{row.tipoArea ? tipoAreaLabel(row.tipoArea) : '—'}</Text>
      <Text style={[cb.cell, cb.cVuln, vc ? { color: vc, fontWeight: '700' as const } : null]}>
        {row.nivelVulnerabilidade !== undefined ? row.nivelVulnerabilidade : '—'}
      </Text>
      <View style={cb.cRisco}>
        {row.nivelRisco && rc ? (
          <View style={[cb.rBadge, { backgroundColor: rc + '18', borderColor: rc }]}>
            <Text style={[cb.rBadgeTxt, { color: rc }]}>{row.nivelRisco}</Text>
          </View>
        ) : <Text style={cb.dash}>—</Text>}
      </View>
      <Text style={[cb.cell, cb.cEst]}>{row.quantidadeEstacoes !== undefined ? row.quantidadeEstacoes : '—'}</Text>
      <Text style={[cb.cell, cb.cAl]}>{row.quantidadeAlertasAtivos !== undefined ? row.quantidadeAlertasAtivos : '—'}</Text>
    </View>
  );
}

function MobileCoverageCard({ row }: { row: CoverageRow }) {
  const rc = row.nivelRisco ? riskColor(row.nivelRisco) : null;
  const vc = row.nivelVulnerabilidade !== undefined ? vulnColor(row.nivelVulnerabilidade) : null;
  return (
    <View style={[mc.card, rc && { borderLeftColor: rc }]}>
      <View style={mc.top}>
        <View style={mc.info}>
          <Text style={mc.nome} numberOfLines={1}>{row.nome}</Text>
          <Text style={mc.sub}>{[row.estado, row.cidade].filter(Boolean).join(' · ')}</Text>
        </View>
        {row.nivelRisco && rc ? (
          <View style={[mc.badge, { backgroundColor: rc + '18', borderColor: rc }]}>
            <Text style={[mc.badgeTxt, { color: rc }]}>{row.nivelRisco}</Text>
          </View>
        ) : null}
      </View>
      <View style={mc.meta}>
        {row.tipoArea ? <Text style={mc.chip}>{tipoAreaLabel(row.tipoArea)}</Text> : null}
        {row.nivelVulnerabilidade !== undefined && vc ? (
          <Text style={[mc.vuln, { color: vc }]}>Vuln. {row.nivelVulnerabilidade}</Text>
        ) : null}
        {row.quantidadeEstacoes !== undefined ? (
          <Text style={mc.metaTxt}>{row.quantidadeEstacoes} est.</Text>
        ) : null}
        {row.quantidadeAlertasAtivos !== undefined ? (
          <Text style={mc.metaTxt}>{row.quantidadeAlertasAtivos} alertas</Text>
        ) : null}
      </View>
    </View>
  );
}

function ActionShortcuts() {
  const actions = [
    { label: 'Ver alertas críticos',   route: '/alertas'            },
    { label: 'Regiões monitoradas',    route: '/regioes'            },
    { label: 'Cadastrar região',       route: '/gerenciar-regioes'  },
    { label: 'Ver indicadores',        route: '/indicadores'        },
  ] as const;
  return (
    <View style={ac.root}>
      <Text style={ac.label}>AÇÕES RÁPIDAS</Text>
      <View style={ac.row}>
        {actions.map(({ label, route }) => (
          <Pressable
            key={route}
            onPress={() => router.push(route)}
            style={({ hovered }) => [ac.btn, hovered && ac.btnHov]}>
            <Text style={ac.btnTxt}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────── */

const s = StyleSheet.create({
  safe:          { backgroundColor: '#F4F5F7', flex: 1 },
  scroll:        { gap: 14, padding: 16 },
  scrollD:       { alignSelf: 'center', maxWidth: 1360, padding: 24, paddingBottom: 48, width: '100%' },

  header:        { alignItems: 'flex-start', gap: 4 },
  headerRow:     { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  pageTitle:     { color: '#1F2937', fontSize: 22, fontWeight: '700' },

  refreshBtn:    { borderColor: '#DDE2EA', borderRadius: 6, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  refreshBtnHov: { backgroundColor: '#EEF2FF', borderColor: '#C5CAE9' },
  refreshBtnDis: { opacity: 0.5 },
  refreshBtnTxt: { color: '#3F51B5', fontSize: 13, fontWeight: '600' },

  loadCard:      { backgroundColor: '#FFF', borderColor: '#DDE2EA', borderRadius: 8, borderWidth: 1, padding: 20 },
  loadTxt:       { color: '#6B7280', fontSize: 14 },
  errCard:       { backgroundColor: '#FFF5F5', borderColor: '#FECACA', borderRadius: 8, borderWidth: 1, gap: 4, padding: 16 },
  errTitle:      { color: '#B91C1C', fontSize: 14, fontWeight: '600' },
  errDetail:     { color: '#6B7280', fontSize: 12 },

  partialErr:    { backgroundColor: '#FFFBEB', borderColor: '#FCD34D', borderRadius: 6, borderWidth: 1, padding: 12 },
  partialErrTxt: { color: '#92400E', fontSize: 12 },

  kpiGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  rowD:          { flexDirection: 'row', gap: 12 },
  rowM:          { gap: 12 },
  flex1:         { flex: 1 },
  flex2:         { flex: 2 },

  donutRow:      { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 16 },

  sensorStats:   { gap: 0 },
  dimList:       { gap: 10 },
  dimRow:        { alignItems: 'center', flexDirection: 'row', gap: 10 },
  dimDot:        { borderRadius: 99, flexShrink: 0, height: 8, width: 8 },
  dimRisco:      { fontSize: 12, fontWeight: '700', width: 110 },
  dimSensores:   { color: '#6B7280', flex: 1, fontSize: 12 },
  dimDisclaimer: { color: '#9CA3AF', fontSize: 10, fontStyle: 'italic', marginTop: 6 },

  noData:        { color: '#9CA3AF', fontSize: 13, paddingVertical: 8, textAlign: 'center' },
});

const zh = StyleSheet.create({
  root:    { alignItems: 'center', flexDirection: 'row', gap: 10 },
  bar:     { backgroundColor: '#3F51B5', borderRadius: 2, height: 16, width: 3 },
  title:   { color: '#1F2937', flex: 1, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  pill:    { backgroundColor: '#EEF2FF', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  pillTxt: { color: '#3F51B5', fontSize: 10, fontWeight: '600' },
});

const op = StyleSheet.create({
  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE2EA',
    borderLeftWidth: 4,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  header:      { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionLabel: { color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  ts:          { color: '#9CA3AF', fontSize: 11 },
  body:        { gap: 14 },
  bodyD:       { alignItems: 'center', flexDirection: 'row' },
  riskBox:     { alignItems: 'flex-start', gap: 6, minWidth: 130 },
  riskSub:     { color: '#6B7280', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  riskPill:    { borderRadius: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  riskVal:     { fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  divider:     { backgroundColor: '#EEF0F4', height: 1 },
  dividerV:    { alignSelf: 'stretch', height: 'auto', marginHorizontal: 8, width: 1 },
  statsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statsRowD:   { flex: 1 },
  stat:        { alignItems: 'flex-start', gap: 2, minWidth: 80 },
  statVal:     { color: '#1F2937', fontSize: 22, fontWeight: '700' },
  statLabel:   { color: '#6B7280', fontSize: 11 },
});

const ins = StyleSheet.create({
  root:  { gap: 8 },
  rootD: { flexDirection: 'row' },
  card:  { backgroundColor: '#F8F9FF', borderColor: '#C5CAE9', borderRadius: 6, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 10 },
  cardD: { flex: 1 },
  marker: { backgroundColor: '#3F51B5', borderRadius: 99, flexShrink: 0, height: 6, marginTop: 4, width: 6 },
  text:  { color: '#374151', flex: 1, fontSize: 12, lineHeight: 17 },
});

const kc = StyleSheet.create({
  chip:  { backgroundColor: '#FFFFFF', borderColor: '#DDE2EA', borderRadius: 6, borderWidth: 1, flexBasis: '14%', flexGrow: 1, gap: 2, minWidth: 80, padding: 10 },
  val:   { color: '#1F2937', fontSize: 18, fontWeight: '700' },
  lbl:   { fontSize: 10, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
});

const ss = StyleSheet.create({
  row:   { alignItems: 'center', borderBottomColor: '#F3F4F6', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  label: { color: '#6B7280', flex: 1, fontSize: 12 },
  value: { fontSize: 14, fontWeight: '700' },
});

const al = StyleSheet.create({
  row:      { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 10 },
  rowBorder: { borderBottomColor: '#F3F4F6', borderBottomWidth: 1 },
  dot:      { borderRadius: 99, flexShrink: 0, height: 8, width: 8 },
  content:  { flex: 1, gap: 2 },
  titulo:   { color: '#1F2937', fontSize: 13, fontWeight: '600' },
  sub:      { color: '#6B7280', fontSize: 11 },
  badge:    { borderRadius: 4, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
});

const cb = StyleSheet.create({
  root:   { overflow: 'hidden' },
  thead: {
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderBottomColor: '#DDE2EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  th:     { color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.4, paddingHorizontal: 4 },
  trow:   { alignItems: 'center', borderBottomColor: '#F3F4F6', borderBottomWidth: 1, flexDirection: 'row', paddingVertical: 9, minHeight: 44 },
  cell:   { color: '#4B5563', fontSize: 12, paddingHorizontal: 4 },
  cUf:    { width: 40 },
  cNome:  { flex: 2, paddingHorizontal: 4 },
  cTipo:  { width: 100 },
  cVuln:  { paddingHorizontal: 4, textAlign: 'center', width: 52 },
  cRisco: { alignItems: 'flex-start', paddingHorizontal: 4, width: 90 },
  cEst:   { paddingHorizontal: 4, textAlign: 'center', width: 52 },
  cAl:    { paddingHorizontal: 4, textAlign: 'center', width: 64 },
  rowNome: { color: '#1F2937', fontSize: 12, fontWeight: '600' },
  rowSub:  { color: '#9CA3AF', fontSize: 10, marginTop: 1 },
  rBadge:  { borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  rBadgeTxt: { fontSize: 10, fontWeight: '700' },
  dash:    { color: '#9CA3AF', fontSize: 12, paddingHorizontal: 4 },
});

const mc = StyleSheet.create({
  card:    { backgroundColor: '#FFFFFF', borderColor: '#DDE2EA', borderLeftWidth: 3, borderRadius: 7, borderWidth: 1, gap: 8, marginBottom: 8, padding: 12 },
  top:     { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  info:    { flex: 1, gap: 2 },
  nome:    { color: '#1F2937', fontSize: 13, fontWeight: '600' },
  sub:     { color: '#6B7280', fontSize: 11 },
  badge:   { borderRadius: 4, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  meta:    { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:    { backgroundColor: '#EEF2FF', borderRadius: 99, color: '#3F51B5', fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2 },
  vuln:    { fontSize: 11, fontWeight: '700' },
  metaTxt: { color: '#6B7280', fontSize: 11 },
});

const ac = StyleSheet.create({
  root:   { gap: 8 },
  label:  { color: '#9CA3AF', fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  row:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn:    { borderColor: '#C5CAE9', borderRadius: 6, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  btnHov: { backgroundColor: '#EEF2FF' },
  btnTxt: { color: '#3F51B5', fontSize: 12, fontWeight: '600' },
});
