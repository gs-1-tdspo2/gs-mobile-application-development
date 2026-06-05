import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilterChip } from '@/components/FilterChip';
import { LoadingState } from '@/components/LoadingState';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { listarClientes } from '@/services/clientesService';
import {
  createRegiao,
  deleteRegiao,
  getRegioes,
  updateRegiao,
} from '@/services/regioesService';
import { screenStyles } from '@/styles/global';
import { Cliente } from '@/types/cliente';
import {
  RegiaoCreateRequest,
  RegiaoReadModel,
  RegiaoUpdateRequest,
  TipoArea,
  TipoVisibilidade,
} from '@/types/regiao';
import { getApiErrorMessage } from '@/utils/apiError';
import { useResponsiveLayout } from '@/utils/responsive';

/* ── Web-only style helper ───────────────────────────── */
// Suppresses the browser's default input outline (black focus rectangle).
const noOutline = { outlineWidth: 0 } as object;

/* ── Constants ───────────────────────────────────────── */

type VulnProfile = 'BAIXA' | 'MODERADA' | 'ALTA' | 'CRITICA';

type FormState = {
  idCliente: number;
  nome: string;
  cidade: string;
  estado: string;
  latitude: string;
  longitude: string;
  tipoArea: TipoArea | '';
  vulnProfile: VulnProfile | '';
  vulnValue: number;
  tipoVisibilidade: TipoVisibilidade | '';
};

type LocationPreset = {
  key: string;
  label: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  tipoArea: TipoArea;
  tipoVisibilidade: TipoVisibilidade;
  nivelVulnerabilidade: number;
};

type Feedback   = { ok: boolean; msg: string };
type ListFilter = 'todos' | 'ativos' | 'inativos';

const MANUAL_KEY = 'outro';

const VULN_PROFILES: { value: VulnProfile; label: string; numericValue: number }[] = [
  { value: 'BAIXA',    label: 'Baixa',   numericValue: 20 },
  { value: 'MODERADA', label: 'Moderada', numericValue: 45 },
  { value: 'ALTA',     label: 'Alta',    numericValue: 65 },
  { value: 'CRITICA',  label: 'Crítica', numericValue: 85 },
];

const LOCATION_PRESETS: LocationPreset[] = [
  {
    key:                  'cais-maua',
    label:                'Cais Mauá - Porto Alegre / RS',
    cidade:               'Porto Alegre',
    estado:               'RS',
    latitude:             -30.0328,
    longitude:            -51.2302,
    tipoArea:             'AREA_URBANA',
    tipoVisibilidade:     'INSTITUCIONAL',
    nivelVulnerabilidade: 86,
  },
  {
    key:                  'ribeirinha-manaus',
    label:                'Comunidade Ribeirinha - Manaus / AM',
    cidade:               'Manaus',
    estado:               'AM',
    latitude:             -3.1190,
    longitude:            -60.0217,
    tipoArea:             'REGIAO_RIBEIRINHA',
    tipoVisibilidade:     'INSTITUCIONAL',
    nivelVulnerabilidade: 82,
  },
  {
    key:                  'encosta-esperanca',
    label:                'Encosta Vila Nova Esperança / RS',
    cidade:               'Porto Alegre',
    estado:               'RS',
    latitude:             -30.0777,
    longitude:            -51.1816,
    tipoArea:             'ENCOSTA',
    tipoVisibilidade:     'INSTITUCIONAL',
    nivelVulnerabilidade: 90,
  },
  {
    key:                  'campus-ribeirao',
    label:                'Campus Climático - Ribeirão Preto / SP',
    cidade:               'Ribeirão Preto',
    estado:               'SP',
    latitude:             -21.1775,
    longitude:            -47.8103,
    tipoArea:             'AREA_URBANA',
    tipoVisibilidade:     'AGREGADA_PUBLICA',
    nivelVulnerabilidade: 76,
  },
  {
    key:                  'ribeirinha-santarem',
    label:                'Região Ribeirinha - Santarém / PA',
    cidade:               'Santarém',
    estado:               'PA',
    latitude:             -2.4431,
    longitude:            -54.7083,
    tipoArea:             'REGIAO_RIBEIRINHA',
    tipoVisibilidade:     'INSTITUCIONAL',
    nivelVulnerabilidade: 78,
  },
  {
    key:                  'semiarido-juazeiro',
    label:                'Semiárido - Juazeiro / BA',
    cidade:               'Juazeiro',
    estado:               'BA',
    latitude:             -9.4162,
    longitude:            -40.5033,
    tipoArea:             'AREA_RURAL',
    tipoVisibilidade:     'AGREGADA_PUBLICA',
    nivelVulnerabilidade: 74,
  },
  {
    key:                  'agroclima-sorriso',
    label:                'Agroclima - Sorriso / MT',
    cidade:               'Sorriso',
    estado:               'MT',
    latitude:             -12.5425,
    longitude:            -55.7211,
    tipoArea:             'AREA_RURAL',
    tipoVisibilidade:     'PRIVADA',
    nivelVulnerabilidade: 68,
  },
];

const LIST_FILTERS: { id: ListFilter; label: string }[] = [
  { id: 'todos',    label: 'TODOS' },
  { id: 'ativos',   label: 'ATIVOS' },
  { id: 'inativos', label: 'INATIVOS' },
];

const TIPO_AREA_OPTIONS: { value: TipoArea; label: string }[] = [
  { value: 'PONTE',               label: 'Ponte' },
  { value: 'ENCOSTA',             label: 'Encosta' },
  { value: 'AREA_RURAL',          label: 'Área rural' },
  { value: 'COMUNIDADE',          label: 'Comunidade' },
  { value: 'PROPRIEDADE_PRIVADA', label: 'Propriedade privada' },
  { value: 'REGIAO_RIBEIRINHA',   label: 'Região ribeirinha' },
  { value: 'AREA_URBANA',         label: 'Área urbana' },
  { value: 'OUTRA',               label: 'Outra' },
];

const TIPO_VIS_OPTIONS: { value: TipoVisibilidade; label: string }[] = [
  { value: 'PRIVADA',          label: 'Privada' },
  { value: 'INSTITUCIONAL',    label: 'Institucional' },
  { value: 'AGREGADA_PUBLICA', label: 'Agregada pública' },
];

const TIPO_AREA_LABEL: Record<string, string> = {
  AREA_URBANA:         'Área Urbana',
  REGIAO_RIBEIRINHA:   'Ribeirinha',
  ENCOSTA:             'Encosta',
  AREA_RURAL:          'Área Rural',
  COMUNIDADE:          'Comunidade',
  PONTE:               'Ponte',
  PROPRIEDADE_PRIVADA: 'Prop. Privada',
  OUTRA:               'Outra',
};

const TIPO_AREA_VALUES = TIPO_AREA_OPTIONS.map((o) => o.value);
const TIPO_VIS_VALUES  = TIPO_VIS_OPTIONS.map((o) => o.value);

const EMPTY_FORM: FormState = {
  idCliente:        0,
  nome:             '',
  cidade:           '',
  estado:           '',
  latitude:         '',
  longitude:        '',
  tipoArea:         '',
  vulnProfile:      '',
  vulnValue:        0,
  tipoVisibilidade: '',
};

/* ── Helpers ─────────────────────────────────────────── */

function closestProfile(value: number): VulnProfile {
  return VULN_PROFILES.reduce<typeof VULN_PROFILES[0]>(
    (best, p) => Math.abs(p.numericValue - value) < Math.abs(best.numericValue - value) ? p : best,
    VULN_PROFILES[0],
  ).value;
}

function presetNome(label: string): string {
  return label.replace(/ \/ [A-Z]{2}$/, '');
}

function getVuln(r: RegiaoReadModel): number | undefined {
  const v = r.raw?.nivelVulnerabilidade;
  return typeof v === 'number' ? v : undefined;
}

function vulnColor(score: number): string {
  if (score >= 75) return '#D32F2F';
  if (score >= 50) return '#EF6C00';
  if (score >= 25) return '#F9A825';
  return '#2E7D32';
}

function fmtTipoArea(r: RegiaoReadModel): string {
  const v = r.raw?.tipoArea;
  if (!v || typeof v !== 'string') return '—';
  return TIPO_AREA_LABEL[v] ?? v;
}

function fmtLocal(r: RegiaoReadModel): string {
  return [r.cidade, r.estado].filter(Boolean).join(' / ') || '—';
}

function getStatus(r: RegiaoReadModel): 'Ativo' | 'Inativo' | undefined {
  if (r.ativo !== undefined) return r.ativo ? 'Ativo' : 'Inativo';
  const n = r.status?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() ?? '';
  if (n.includes('ativo'))   return 'Ativo';
  if (n.includes('inativo')) return 'Inativo';
  return undefined;
}

function norm(v?: string): string {
  return v?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() ?? '';
}

function safeIdCliente(raw: RegiaoReadModel['raw']): number {
  const v = raw?.idCliente;
  return typeof v === 'number' && v > 0 ? v : 0;
}

function safeTipoArea(raw: RegiaoReadModel['raw']): TipoArea | '' {
  const v = raw?.tipoArea;
  if (typeof v === 'string' && (TIPO_AREA_VALUES as string[]).includes(v)) return v as TipoArea;
  return '';
}

function safeTipoVis(raw: RegiaoReadModel['raw']): TipoVisibilidade | '' {
  const v = raw?.tipoVisibilidade;
  if (typeof v === 'string' && (TIPO_VIS_VALUES as string[]).includes(v)) return v as TipoVisibilidade;
  return '';
}

function buildPayload(form: FormState): RegiaoCreateRequest {
  return {
    idCliente:            form.idCliente,
    nome:                 form.nome.trim(),
    cidade:               form.cidade.trim(),
    estado:               form.estado.trim().toUpperCase(),
    latitude:             parseFloat(form.latitude),
    longitude:            parseFloat(form.longitude),
    tipoArea:             form.tipoArea as TipoArea,
    nivelVulnerabilidade: form.vulnValue,
    tipoVisibilidade:     form.tipoVisibilidade as TipoVisibilidade,
  };
}

function validateForm(form: FormState): string | null {
  if (form.idCliente <= 0)               return 'Selecione um cliente.';
  if (form.nome.trim().length < 3)       return 'Nome deve ter pelo menos 3 caracteres.';
  if (form.cidade.trim().length < 2)     return 'Informe a cidade.';
  if (form.estado.trim().length !== 2)   return 'UF deve ter exatamente 2 letras.';
  if (!form.tipoArea)                    return 'Selecione o tipo de área.';
  if (!form.vulnProfile)                 return 'Selecione o perfil de vulnerabilidade.';
  if (form.latitude.trim() === '')       return 'Informe a latitude.';
  const lat = parseFloat(form.latitude);
  if (isNaN(lat) || lat < -90 || lat > 90)   return 'Latitude deve estar entre -90 e 90.';
  if (form.longitude.trim() === '')      return 'Informe a longitude.';
  const lng = parseFloat(form.longitude);
  if (isNaN(lng) || lng < -180 || lng > 180) return 'Longitude deve estar entre -180 e 180.';
  if (!form.tipoVisibilidade)            return 'Selecione a visibilidade.';
  return null;
}

/* ── Screen ──────────────────────────────────────────── */

export default function GerenciarRegioesScreen() {
  const [regioes, setRegioes]                 = useState<RegiaoReadModel[]>([]);
  const [clientes, setClientes]               = useState<Cliente[]>([]);
  const [clientesLoading, setClientesLoading] = useState(true);
  const [form, setForm]                       = useState<FormState>(EMPTY_FORM);
  const [selectedPreset, setSelectedPreset]   = useState<string | null>(null);
  const [editing, setEditing]                 = useState<RegiaoReadModel | null>(null);
  const [formOpen, setFormOpen]               = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [isSaving, setIsSaving]               = useState(false);
  const [deletingId, setDeletingId]           = useState<number | string | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<RegiaoReadModel | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [validation, setValidation]           = useState<string | null>(null);
  const [feedback, setFeedback]               = useState<Feedback | null>(null);
  const [search, setSearch]                   = useState('');
  const [listFilter, setListFilter]           = useState<ListFilter>('todos');
  const { isDesktop }                         = useResponsiveLayout();

  const formTitle   = editing ? 'Editar Região' : 'Nova Região';
  const submitLabel = isSaving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar região';
  const isPresetActive = selectedPreset !== null && selectedPreset !== MANUAL_KEY;

  const adminStats = useMemo(() => ({
    total:    regioes.length,
    ativos:   regioes.filter((r) => r.ativo !== false).length,
    inativos: regioes.filter((r) => r.ativo === false).length,
  }), [regioes]);

  const sorted = useMemo(
    () => [...regioes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [regioes],
  );

  const visible = useMemo(() => {
    const q = norm(search.trim());
    return sorted.filter((r) => {
      if (q) {
        const haystack = norm([r.nome, r.cidade, r.estado].filter(Boolean).join(' '));
        if (!haystack.includes(q)) return false;
      }
      if (listFilter === 'ativos')   return r.ativo !== false;
      if (listFilter === 'inativos') return r.ativo === false;
      return true;
    });
  }, [sorted, search, listFilter]);

  const loadRegioes = useCallback(async (showLoad = true) => {
    if (showLoad) setIsLoading(true);
    setError(null);
    try {
      setRegioes(await getRegioes());
    } catch (e) {
      setRegioes([]);
      setError(getApiErrorMessage(e));
    } finally {
      if (showLoad) setIsLoading(false);
    }
  }, []);

  const loadClientes = useCallback(async () => {
    setClientesLoading(true);
    try {
      setClientes(await listarClientes());
    } catch {
      setClientes([]);
    } finally {
      setClientesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRegioes();
    void loadClientes();
  }, [loadRegioes, loadClientes]);

  function handlePresetSelect(key: string) {
    setSelectedPreset(key);
    if (key === MANUAL_KEY) return;
    const preset = LOCATION_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    const profile = closestProfile(preset.nivelVulnerabilidade);
    setForm((prev) => ({
      ...prev,
      cidade:           preset.cidade,
      estado:           preset.estado,
      latitude:         String(preset.latitude),
      longitude:        String(preset.longitude),
      tipoArea:         preset.tipoArea,
      tipoVisibilidade: preset.tipoVisibilidade,
      vulnProfile:      profile,
      vulnValue:        preset.nivelVulnerabilidade,
      nome:             prev.nome.trim() === '' ? presetNome(preset.label) : prev.nome,
    }));
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSelectedPreset(null);
    setValidation(null);
    setFeedback(null);
    setFormOpen(true);
  }

  function openEdit(r: RegiaoReadModel) {
    setEditing(r);
    setSelectedPreset(null);
    const raw   = r.raw;
    const lat   = typeof raw?.latitude === 'number' ? String(raw.latitude) : '';
    const lng   = typeof raw?.longitude === 'number' ? String(raw.longitude) : '';
    const rawVuln = typeof raw?.nivelVulnerabilidade === 'number' ? raw.nivelVulnerabilidade : 0;
    setForm({
      idCliente:        safeIdCliente(raw),
      nome:             r.nome,
      cidade:           r.cidade ?? '',
      estado:           r.estado ?? '',
      latitude:         lat,
      longitude:        lng,
      tipoArea:         safeTipoArea(raw),
      vulnProfile:      rawVuln > 0 ? closestProfile(rawVuln) : '',
      vulnValue:        rawVuln,
      tipoVisibilidade: safeTipoVis(raw),
    });
    setValidation(null);
    setFeedback(null);
    setFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSelectedPreset(null);
    setValidation(null);
    setFormOpen(false);
  }

  async function handleSubmit() {
    const err = validateForm(form);
    if (err) { setValidation(err); return; }
    setIsSaving(true);
    setValidation(null);
    setFeedback(null);
    try {
      const payload = buildPayload(form);
      if (editing) {
        await updateRegiao(editing.id, payload as RegiaoUpdateRequest);
        setFeedback({ ok: true, msg: 'Região atualizada com sucesso.' });
      } else {
        await createRegiao(payload);
        setFeedback({ ok: true, msg: 'Região criada com sucesso.' });
      }
      closeForm();
      await loadRegioes(false);
    } catch (e) {
      setFeedback({ ok: false, msg: `Não foi possível salvar. ${getApiErrorMessage(e)}` });
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete(r: RegiaoReadModel) {
    setDeleteTarget(r);
  }

  async function handleDelete(r: RegiaoReadModel) {
    setDeleteTarget(null);
    setDeletingId(r.id);
    setFeedback(null);
    try {
      await deleteRegiao(r.id);
      setFeedback({ ok: true, msg: `"${r.nome}" foi excluída.` });
      setListFilter('todos');
      await loadRegioes(false);
    } catch (e) {
      setFeedback({ ok: false, msg: `Não foi possível excluir. ${getApiErrorMessage(e)}` });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell activeRoute="gerenciar">
      <SafeAreaView style={screenStyles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}>
          <ScrollView
            contentContainerStyle={[
              screenStyles.scrollContent,
              isDesktop && screenStyles.desktopScrollContent,
            ]}>

            {/* ── Page header ──────────────────────────── */}
            <View style={[styles.pageHeader, isDesktop && styles.pageHeaderRow]}>
              <Text style={styles.pageTitle}>Gerenciar Regiões</Text>
              {isDesktop ? (
                <AppButton label="Nova Região" onPress={openCreate} style={styles.newBtn} />
              ) : null}
            </View>

            {/* ── Admin stats line ─────────────────────── */}
            {!isLoading && !error ? (
              <View style={styles.adminStats}>
                <Text style={styles.adminStat}>
                  <Text style={styles.adminStatNum}>{adminStats.total}</Text>
                  {' registros'}
                </Text>
                <Text style={styles.adminStatSep}>·</Text>
                <Text style={styles.adminStat}>
                  <Text style={styles.adminStatNum}>{adminStats.ativos}</Text>
                  {' ativos'}
                </Text>
                <Text style={styles.adminStatSep}>·</Text>
                <Text style={styles.adminStat}>
                  <Text style={styles.adminStatNum}>{adminStats.inativos}</Text>
                  {' inativos'}
                </Text>
              </View>
            ) : null}

            {/* ── Management toolbar ───────────────────── */}
            {isDesktop ? (
              <View style={styles.toolbarDesktop}>
                <View style={[styles.searchWrap, styles.searchWrapFlex]}>
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Buscar por nome ou cidade"
                    placeholderTextColor="#9CA3AF"
                    style={[styles.searchInput, noOutline]}
                    clearButtonMode="while-editing"
                  />
                </View>
                <View style={styles.filterRow}>
                  {LIST_FILTERS.map((f) => (
                    <FilterChip
                      key={f.id}
                      label={f.label}
                      selected={listFilter === f.id}
                      onPress={() => setListFilter(f.id)}
                    />
                  ))}
                </View>
                <Pressable
                  onPress={() => { void loadRegioes(); }}
                  style={({ hovered }) => [styles.refreshBtn, hovered && styles.refreshBtnHover]}>
                  <Text style={styles.refreshBtnText}>Atualizar</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.toolbarMobile}>
                <View style={styles.searchWrap}>
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Buscar por nome ou cidade"
                    placeholderTextColor="#9CA3AF"
                    style={[styles.searchInput, noOutline]}
                    clearButtonMode="while-editing"
                  />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterRow}>
                    {LIST_FILTERS.map((f) => (
                      <FilterChip
                        key={f.id}
                        label={f.label}
                        selected={listFilter === f.id}
                        onPress={() => setListFilter(f.id)}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* ── Feedback toast ───────────────────────── */}
            {feedback ? (
              <View style={[styles.toast, feedback.ok ? styles.toastOk : styles.toastErr]}>
                <Text style={[styles.toastText, feedback.ok ? styles.toastTextOk : styles.toastTextErr]}>
                  {feedback.msg}
                </Text>
              </View>
            ) : null}

            {/* ── Mobile action bar ────────────────────── */}
            {!isDesktop ? (
              <View style={styles.mobileActions}>
                <AppButton label="Nova Região" onPress={openCreate} style={styles.actionBtn} />
                <AppButton
                  label="Atualizar"
                  onPress={() => { void loadRegioes(); }}
                  variant="secondary"
                  style={styles.actionBtn}
                />
              </View>
            ) : null}

            {/* ── Form panel ───────────────────────────── */}
            {formOpen ? (
              <AppCard
                title={formTitle}
                subtitle="Campos com * são obrigatórios."
                variant="elevated"
                style={isDesktop ? styles.formCard : undefined}>
                <View style={styles.form}>

                  {/* Validation error */}
                  {validation ? (
                    <View style={styles.validationMsg}>
                      <Text style={styles.validationText}>{validation}</Text>
                    </View>
                  ) : null}

                  {/* ── 1. CLIENTE ─────────────────────── */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Cliente *</Text>
                    {clientesLoading ? (
                      <Text style={styles.fieldHint}>Carregando clientes...</Text>
                    ) : clientes.length === 0 ? (
                      <View style={styles.noClienteMsg}>
                        <Text style={styles.noClienteText}>
                          Cadastre um cliente antes de criar regiões.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.chipRow}>
                        {clientes.map((c) => {
                          const cid   = c.idCliente ?? 0;
                          const label = c.nome ?? `Cliente ${cid}`;
                          return (
                            <FilterChip
                              key={cid}
                              label={label}
                              selected={form.idCliente === cid}
                              onPress={() => setForm((p) => ({ ...p, idCliente: cid }))}
                            />
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* ── 2. NOME ────────────────────────── */}
                  <FormField
                    label="Nome da região *"
                    value={form.nome}
                    onChange={(v) => setForm((p) => ({ ...p, nome: v }))}
                    placeholder="Ex.: Região Ribeirinha Norte"
                  />

                  {/* ── 3. LOCAL MONITORADO ────────────── */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Local monitorado</Text>
                    <View style={styles.chipRow}>
                      {LOCATION_PRESETS.map((p) => (
                        <FilterChip
                          key={p.key}
                          label={p.label}
                          selected={selectedPreset === p.key}
                          onPress={() => handlePresetSelect(p.key)}
                        />
                      ))}
                      <FilterChip
                        label="Outro / preencher manualmente"
                        selected={selectedPreset === MANUAL_KEY}
                        onPress={() => handlePresetSelect(MANUAL_KEY)}
                      />
                    </View>
                  </View>

                  <View style={styles.sectionDivider} />

                  {/* ── 4. PERFIL OPERACIONAL ──────────── */}
                  <Text style={styles.sectionLabel}>PERFIL OPERACIONAL</Text>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Tipo de área *</Text>
                    <View style={styles.chipRow}>
                      {TIPO_AREA_OPTIONS.map((opt) => (
                        <FilterChip
                          key={opt.value}
                          label={opt.label}
                          selected={form.tipoArea === opt.value}
                          onPress={() => setForm((p) => ({ ...p, tipoArea: opt.value }))}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Perfil de vulnerabilidade *</Text>
                    <View style={styles.chipRow}>
                      {VULN_PROFILES.map((opt) => (
                        <FilterChip
                          key={opt.value}
                          label={opt.label}
                          selected={form.vulnProfile === opt.value}
                          onPress={() => setForm((p) => ({
                            ...p,
                            vulnProfile: opt.value,
                            vulnValue:   opt.numericValue,
                          }))}
                        />
                      ))}
                    </View>
                    {form.vulnProfile ? (
                      <Text style={styles.vulnTechNote}>
                        Valor técnico enviado: {form.vulnValue}/100
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.sectionDivider} />

                  {/* ── 5. LOCALIZAÇÃO OPERACIONAL ─────── */}
                  <Text style={styles.sectionLabel}>LOCALIZAÇÃO OPERACIONAL</Text>
                  <Text style={styles.coordHint}>
                    As coordenadas são usadas para sincronizar dados climáticos públicos e calcular risco ambiental da região monitorada.
                  </Text>

                  {isPresetActive ? (
                    <View style={styles.presetFilledBadge}>
                      <Text style={styles.presetFilledText}>
                        Preenchido automaticamente pelo local selecionado. Você pode ajustar se necessário.
                      </Text>
                    </View>
                  ) : null}

                  {/* Cidade / UF */}
                  <View style={[styles.formRow, isDesktop && styles.formRowDesktop]}>
                    <FormField
                      label="Cidade *"
                      value={form.cidade}
                      onChange={(v) => setForm((p) => ({ ...p, cidade: v }))}
                      placeholder="Ex.: Manaus"
                      style={styles.formFlex}
                    />
                    <FormField
                      label="UF *"
                      value={form.estado}
                      onChange={(v) => setForm((p) => ({ ...p, estado: v.toUpperCase().slice(0, 2) }))}
                      placeholder="AM"
                      autoCapitalize="characters"
                      maxLength={2}
                      style={styles.formShort}
                    />
                  </View>

                  {/* Latitude / Longitude */}
                  <View style={[
                    styles.formRow,
                    isDesktop && styles.formRowDesktop,
                    isPresetActive && styles.formRowDimmed,
                  ]}>
                    <FormField
                      label="Latitude"
                      value={form.latitude}
                      onChange={(v) => setForm((p) => ({ ...p, latitude: v }))}
                      placeholder="Ex.: -3.119028"
                      keyboardType="numeric"
                      style={styles.formFlex}
                    />
                    <FormField
                      label="Longitude"
                      value={form.longitude}
                      onChange={(v) => setForm((p) => ({ ...p, longitude: v }))}
                      placeholder="Ex.: -60.021731"
                      keyboardType="numeric"
                      style={styles.formFlex}
                    />
                  </View>

                  <View style={styles.sectionDivider} />

                  {/* ── 6. VISIBILIDADE ────────────────── */}
                  <Text style={styles.sectionLabel}>VISIBILIDADE</Text>

                  <View style={styles.fieldGroup}>
                    <View style={styles.chipRow}>
                      {TIPO_VIS_OPTIONS.map((opt) => (
                        <FilterChip
                          key={opt.value}
                          label={opt.label}
                          selected={form.tipoVisibilidade === opt.value}
                          onPress={() => setForm((p) => ({ ...p, tipoVisibilidade: opt.value }))}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Form actions */}
                  <View style={styles.formActions}>
                    <AppButton
                      label={submitLabel}
                      onPress={() => { void handleSubmit(); }}
                      disabled={isSaving}
                      style={styles.actionBtn}
                    />
                    <AppButton
                      label="Cancelar"
                      onPress={closeForm}
                      variant="ghost"
                      disabled={isSaving}
                      style={styles.actionBtn}
                    />
                  </View>

                </View>
              </AppCard>
            ) : null}

            {/* ── States ───────────────────────────────── */}
            {isLoading ? <LoadingState message="Carregando regiões..." /> : null}
            {error ? <ErrorState message={error} onRetry={loadRegioes} /> : null}

            {!isLoading && !error && regioes.length === 0 ? (
              <EmptyState title="Nenhuma região cadastrada" description="Crie a primeira região acima." />
            ) : null}

            {!isLoading && !error && regioes.length > 0 && visible.length === 0 ? (
              <EmptyState title="Nenhuma região encontrada" description="Ajuste a busca ou o filtro." />
            ) : null}

            {/* ── Records table ────────────────────────── */}
            {!isLoading && !error && visible.length > 0 ? (
              <View style={styles.tableContainer}>
                {isDesktop ? (
                  <View style={styles.tableHead}>
                    <Text style={[styles.thCell, styles.colNome]}>REGIÃO</Text>
                    <Text style={[styles.thCell, styles.colArea]}>TIPO DE ÁREA</Text>
                    <Text style={[styles.thCell, styles.colVuln]}>VULN.</Text>
                    <Text style={[styles.thCell, styles.colStatus]}>STATUS</Text>
                    <Text style={[styles.thCell, styles.colAcoes]}>AÇÕES</Text>
                  </View>
                ) : null}

                {visible.map((r) => {
                  const vuln     = getVuln(r);
                  const inactive = r.ativo === false;
                  const highVuln = (vuln ?? 0) >= 70 && !inactive;
                  const status   = getStatus(r);

                  return isDesktop ? (
                    <View
                      key={String(r.id)}
                      style={[
                        styles.tableRow,
                        inactive && styles.tableRowInactive,
                        highVuln && styles.tableRowHighVuln,
                      ]}>
                      {highVuln && <View style={styles.rowAccent} />}
                      <View style={styles.colNome}>
                        <Text style={[styles.rowNome, inactive && styles.rowNomeMuted]}>
                          {r.nome}
                        </Text>
                        <Text style={styles.rowSub}>{fmtLocal(r)}</Text>
                      </View>
                      <Text style={[styles.rowCell, styles.colArea]}>{fmtTipoArea(r)}</Text>
                      <View style={styles.colVuln}>
                        <VulnScore score={vuln} />
                      </View>
                      <View style={styles.colStatus}>
                        {status
                          ? <StatusBadge status={status} />
                          : <Text style={styles.dash}>—</Text>}
                      </View>
                      <View style={[styles.colAcoes, styles.actionsRow]}>
                        <Pressable
                          onPress={() => openEdit(r)}
                          style={({ hovered }) => [styles.editBtn, hovered && styles.editBtnHover]}>
                          <Text style={styles.editBtnText}>Editar</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => confirmDelete(r)}
                          disabled={deletingId === r.id}
                          style={({ hovered }) => [styles.deleteBtn, hovered && styles.deleteBtnHover]}>
                          <Text style={styles.deleteBtnText}>
                            {deletingId === r.id ? '...' : 'Excluir'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View
                      key={String(r.id)}
                      style={[styles.mobileCard, inactive && styles.mobileCardInactive]}>
                      <View style={styles.mobileCardTop}>
                        <Text style={[styles.rowNome, inactive && styles.rowNomeMuted]} numberOfLines={1}>
                          {r.nome}
                        </Text>
                        {status ? <StatusBadge status={status} /> : null}
                      </View>
                      <Text style={styles.rowSub}>{fmtLocal(r)}</Text>
                      <View style={styles.mobileCardMeta}>
                        {fmtTipoArea(r) !== '—' ? (
                          <Text style={styles.tipoChip}>{fmtTipoArea(r)}</Text>
                        ) : null}
                        {vuln !== undefined ? <VulnScore score={vuln} /> : null}
                      </View>
                      <View style={styles.mobileCardActions}>
                        <AppButton
                          label="Editar"
                          onPress={() => openEdit(r)}
                          variant="secondary"
                          style={styles.actionBtn}
                        />
                        <AppButton
                          label={deletingId === r.id ? 'Excluindo...' : 'Excluir'}
                          onPress={() => confirmDelete(r)}
                          variant="danger"
                          disabled={deletingId === r.id}
                          style={styles.actionBtn}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Delete confirmation modal ─────────────── */}
        <Modal
          visible={deleteTarget !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteTarget(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalIconWrap}>
                <Text style={styles.modalIcon}>⚠</Text>
              </View>
              <Text style={styles.modalTitle}>Excluir região</Text>
              <Text style={styles.modalBody}>
                {'Deseja excluir '}
                <Text style={styles.modalBold}>{deleteTarget?.nome}</Text>
                {'?\n\nEsta ação não pode ser desfeita.'}
              </Text>
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setDeleteTarget(null)}
                  style={({ hovered }) => [styles.modalCancelBtn, hovered && styles.modalCancelBtnHover]}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={() => deleteTarget && void handleDelete(deleteTarget)}
                  style={({ hovered }) => [styles.modalConfirmBtn, hovered && styles.modalConfirmBtnHover]}>
                  <Text style={styles.modalConfirmText}>Excluir</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </AppShell>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function VulnScore({ score }: { score?: number }) {
  if (score === undefined) return <Text style={vs.dash}>—</Text>;
  return <Text style={[vs.num, { color: vulnColor(score) }]}>{score}</Text>;
}

function FormField({
  label, value, onChange, placeholder, multiline, autoCapitalize, maxLength, keyboardType, style,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'email-address';
  style?: object;
}) {
  return (
    <View style={[ff.group, style]}>
      <Text style={ff.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        keyboardType={keyboardType}
        style={[ff.input, multiline && ff.multiline, noOutline]}
      />
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────── */

const styles = StyleSheet.create({
  kav: { flex: 1 },

  pageHeader:    { gap: 6 },
  pageHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pageTitle: { color: '#1F2937', fontSize: 24, fontWeight: '700' },
  newBtn:    { minWidth: 140 },

  adminStats:   { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  adminStat:    { color: '#6B7280', fontSize: 13 },
  adminStatNum: { color: '#1F2937', fontWeight: '700' },
  adminStatSep: { color: '#C5CAE9', fontSize: 15 },

  toolbarDesktop: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  toolbarMobile:  { gap: 8 },
  searchWrap: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchWrapFlex: { flex: 1 },
  searchInput: {
    color: '#1F2937',
    fontSize: 14,
    height: 40,
  },
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.md },
  refreshBtn: {
    borderColor: '#DDE2EA',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshBtnHover: { backgroundColor: '#EEF2FF', borderColor: '#C5CAE9' },
  refreshBtnText:  { color: '#3F51B5', fontSize: 13, fontWeight: '600' },

  toast:       { borderRadius: 6, borderWidth: 1, padding: 12 },
  toastOk:     { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  toastErr:    { backgroundColor: '#FFF5F5', borderColor: '#FCA5A5' },
  toastText:   { fontSize: 13, fontWeight: '600' },
  toastTextOk: { color: '#166534' },
  toastTextErr:{ color: '#D32F2F' },

  mobileActions: { flexDirection: 'row', gap: spacing.sm },

  formCard:       { alignSelf: 'flex-start', maxWidth: 720, width: '100%' },
  form:           { gap: spacing.md },
  formRow:        { gap: spacing.md },
  formRowDesktop: { flexDirection: 'row' },
  formRowDimmed:  { opacity: 0.65 },
  formFlex:       { flex: 1 },
  formShort:      { width: 100 },

  fieldGroup:  { gap: spacing.xs },
  fieldLabel:  { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  fieldHint:   { color: colors.textMuted, fontSize: 13 },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  sectionDivider: {
    borderBottomColor: '#EEF0F4',
    borderBottomWidth: 1,
    marginVertical: 2,
  },
  sectionLabel: {
    color: '#3F51B5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  coordHint: {
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  presetFilledBadge: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C5CAE9',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetFilledText: {
    color: '#3F51B5',
    fontSize: 12,
  },
  vulnTechNote: {
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },

  formActions:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  validationMsg:  {
    backgroundColor: '#FFF5F5', borderColor: '#FCA5A5',
    borderRadius: 6, borderWidth: 1, padding: 10,
  },
  validationText: { color: '#D32F2F', fontSize: 13, fontWeight: '600' },
  noClienteMsg: {
    backgroundColor: '#FFFBEB', borderColor: '#FCD34D',
    borderRadius: 6, borderWidth: 1, padding: 10,
  },
  noClienteText: { color: '#92400E', fontSize: 13 },
  actionBtn:     { flex: 1 },

  tableContainer: {
    backgroundColor: colors.surface,
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHead: {
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderBottomColor: '#DDE2EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thCell: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 4 },
  tableRow: {
    alignItems: 'center',
    borderBottomColor: '#EEF0F4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
  },
  tableRowInactive: { backgroundColor: '#F8F9FA' },
  tableRowHighVuln: { backgroundColor: '#FFF8F0' },
  rowAccent: {
    backgroundColor: '#EF6C00',
    bottom: 0, left: 0,
    position: 'absolute',
    top: 0, width: 3,
  },

  colNome:    { flex: 2, paddingHorizontal: 4 },
  colArea:    { width: 120, paddingHorizontal: 4 },
  colVuln:    { width: 60,  paddingHorizontal: 4 },
  colStatus:  { width: 80,  paddingHorizontal: 4 },
  colAcoes:   { width: 160, paddingHorizontal: 4 },
  actionsRow: { flexDirection: 'row', gap: 8 },

  rowNome:      { color: colors.neutralText, fontSize: 13, fontWeight: '600' },
  rowNomeMuted: { color: colors.mutedText },
  rowSub:       { color: colors.mutedText, fontSize: 11, marginTop: 1 },
  rowCell:      { color: colors.mutedText, fontSize: 13 },
  dash:         { color: colors.mutedText, fontSize: 13 },

  editBtn: {
    borderColor: '#C5CAE9', borderRadius: 4, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  editBtnHover: { backgroundColor: '#EEF2FF' },
  editBtnText:  { color: '#3F51B5', fontSize: 12, fontWeight: '600' },
  deleteBtn: {
    borderColor: '#FECACA', borderRadius: 4, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  deleteBtnHover: { backgroundColor: '#FFF5F5' },
  deleteBtnText:  { color: '#D32F2F', fontSize: 12, fontWeight: '600' },

  mobileCard: {
    backgroundColor: colors.surface,
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    margin: 8,
    padding: 14,
  },
  mobileCardInactive: { backgroundColor: '#F8F9FA' },
  mobileCardTop:     { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  mobileCardMeta:    { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mobileCardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  tipoChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 99,
    color: '#3F51B5',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    gap: 10,
    maxWidth: 400,
    paddingHorizontal: 28,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    width: '90%',
  },
  modalIconWrap: {
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 99,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  modalIcon:    { color: '#D32F2F', fontSize: 24 },
  modalTitle:   { color: '#111827', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  modalBody:    { color: '#4B5563', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  modalBold:    { color: '#111827', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6, width: '100%' },
  modalCancelBtn: {
    alignItems: 'center',
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 11,
  },
  modalCancelBtnHover: { backgroundColor: '#F4F5F7' },
  modalCancelText:     { color: '#374151', fontSize: 14, fontWeight: '600' },
  modalConfirmBtn: {
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 11,
  },
  modalConfirmBtnHover: { backgroundColor: '#B71C1C' },
  modalConfirmText:     { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

const ff = StyleSheet.create({
  group: { gap: 4 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  input: {
    backgroundColor: '#FAFAFA',
    borderColor: '#DDE2EA',
    borderRadius: 6,
    borderWidth: 1,
    color: colors.neutralText,
    fontSize: 14,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});

const vs = StyleSheet.create({
  num:  { fontSize: 13, fontWeight: '700' },
  dash: { color: '#6B7280', fontSize: 13 },
});
