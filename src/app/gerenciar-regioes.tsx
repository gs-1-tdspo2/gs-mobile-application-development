import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import {
  createRegiao,
  deleteRegiao,
  getRegioes,
  updateRegiao,
} from '@/services/regioesService';
import { screenStyles } from '@/styles/global';
import { RegiaoCreateRequest, RegiaoReadModel, RegiaoUpdateRequest } from '@/types/regiao';
import { getApiErrorMessage } from '@/utils/apiError';
import { useResponsiveLayout } from '@/utils/responsive';

/* ── Constants ───────────────────────────────────────── */

type ClientType = 'Governo / Defesa Civil' | 'ONG';
type FormState = {
  nome: string; cidade: string; estado: string;
  tipoCliente: ClientType | ''; descricao: string; ativo: boolean;
};
type Feedback   = { ok: boolean; msg: string };
type ListFilter = 'todos' | 'ativos' | 'inativos';

const LIST_FILTERS: { id: ListFilter; label: string }[] = [
  { id: 'todos',    label: 'TODOS' },
  { id: 'ativos',   label: 'ATIVOS' },
  { id: 'inativos', label: 'INATIVOS' },
];

const CLIENT_TYPES: ClientType[] = ['Governo / Defesa Civil', 'ONG'];

const EMPTY_FORM: FormState = {
  nome: '', cidade: '', estado: '', tipoCliente: '', descricao: '', ativo: true,
};

const TIPO_AREA_LABEL: Record<string, string> = {
  AREA_URBANA:         'Área Urbana',
  REGIAO_RIBEIRINHA:   'Ribeirinha',
  ENCOSTA:             'Encosta',
  AREA_RURAL:          'Área Rural',
  COMUNIDADE:          'Comunidade',
  PONTE:               'Ponte',
  PROPRIEDADE_PRIVADA: 'Prop. Privada',
};

/* ── Helpers ─────────────────────────────────────────── */

// nivelVulnerabilidade is not explicitly in the Regiao type (index sig returns unknown).
// This guard narrows it to number | undefined safely.
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
  const v = r.raw?.tipoArea;   // tipoArea is explicitly typed in Regiao
  if (!v) return '—';
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

function buildPayload(form: FormState): RegiaoCreateRequest {
  return {
    nome:       form.nome.trim(),
    cidade:     form.cidade.trim(),
    estado:     form.estado.trim().toUpperCase(),
    tipoCliente: form.tipoCliente,
    descricao:  form.descricao.trim() || undefined,
    ativo:      form.ativo,
  };
}

function validateForm(form: FormState): string | null {
  if (form.nome.trim().length < 3)    return 'Nome deve ter pelo menos 3 caracteres.';
  if (form.cidade.trim().length < 2)  return 'Informe a cidade.';
  if (!form.estado.trim())            return 'Informe o estado (UF).';
  if (form.estado.trim().length !== 2) return 'Estado deve ter 2 letras (UF).';
  if (!form.tipoCliente)              return 'Selecione o tipo de cliente.';
  return null;
}

function normalizeClient(v?: string): ClientType | '' {
  if (v === 'Governo / Defesa Civil' || v === 'ONG') return v;
  const n = v?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() ?? '';
  if (n.includes('governo') || n.includes('defesa')) return 'Governo / Defesa Civil';
  if (n.includes('ong')) return 'ONG';
  return '';
}

function norm(v?: string): string {
  return v?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() ?? '';
}

/* ── Screen ──────────────────────────────────────────── */

export default function GerenciarRegioesScreen() {
  const [regioes, setRegioes]       = useState<RegiaoReadModel[]>([]);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing]       = useState<RegiaoReadModel | null>(null);
  const [formOpen, setFormOpen]     = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [feedback, setFeedback]     = useState<Feedback | null>(null);
  const [search, setSearch]         = useState('');
  const [listFilter, setListFilter] = useState<ListFilter>('todos');
  const { isDesktop }               = useResponsiveLayout();

  const formTitle   = editing ? 'Editar Região' : 'Nova Região';
  const submitLabel = isSaving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar região';

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

  useEffect(() => { void loadRegioes(); }, [loadRegioes]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setValidation(null);
    setFeedback(null);
    setFormOpen(true);
  }

  function openEdit(r: RegiaoReadModel) {
    setEditing(r);
    setForm({
      nome:        r.nome,
      cidade:      r.cidade ?? '',
      estado:      r.estado ?? '',
      tipoCliente: normalizeClient(r.tipoCliente),
      descricao:   r.descricao ?? '',
      ativo:       r.ativo ?? true,
    });
    setValidation(null);
    setFeedback(null);
    setFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
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
    Alert.alert(
      'Excluir região',
      `Deseja excluir "${r.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => { void handleDelete(r); } },
      ],
    );
  }

  async function handleDelete(r: RegiaoReadModel) {
    setDeletingId(r.id);
    setFeedback(null);
    try {
      await deleteRegiao(r.id);
      setFeedback({ ok: true, msg: 'Região excluída com sucesso.' });
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
                    style={styles.searchInput}
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
                    style={styles.searchInput}
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
                  {validation ? (
                    <View style={styles.validationMsg}>
                      <Text style={styles.validationText}>{validation}</Text>
                    </View>
                  ) : null}

                  <FormField
                    label="Nome da região *"
                    value={form.nome}
                    onChange={(v) => setForm((p) => ({ ...p, nome: v }))}
                    placeholder="Ex.: Região Ribeirinha Norte"
                  />
                  <View style={[styles.formRow, isDesktop && styles.formRowDesktop]}>
                    <FormField
                      label="Cidade *"
                      value={form.cidade}
                      onChange={(v) => setForm((p) => ({ ...p, cidade: v }))}
                      placeholder="Ex.: Manaus"
                      style={styles.formFlex}
                    />
                    <FormField
                      label="Estado (UF) *"
                      value={form.estado}
                      onChange={(v) => setForm((p) => ({ ...p, estado: v.toUpperCase().slice(0, 2) }))}
                      placeholder="AM"
                      autoCapitalize="characters"
                      maxLength={2}
                      style={styles.formShort}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Tipo de cliente *</Text>
                    <View style={styles.chipRow}>
                      {CLIENT_TYPES.map((t) => (
                        <FilterChip
                          key={t} label={t}
                          selected={form.tipoCliente === t}
                          onPress={() => setForm((p) => ({ ...p, tipoCliente: t }))}
                        />
                      ))}
                    </View>
                  </View>

                  <FormField
                    label="Descrição"
                    value={form.descricao}
                    onChange={(v) => setForm((p) => ({ ...p, descricao: v }))}
                    placeholder="Contexto ambiental ou climático da região"
                    multiline
                  />

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Status</Text>
                    <View style={styles.chipRow}>
                      <FilterChip label="Ativa"   selected={form.ativo}  onPress={() => setForm((p) => ({ ...p, ativo: true }))} />
                      <FilterChip label="Inativa" selected={!form.ativo} onPress={() => setForm((p) => ({ ...p, ativo: false }))} />
                    </View>
                  </View>

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
  label, value, onChange, placeholder, multiline, autoCapitalize, maxLength, style,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number; style?: object;
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
        style={[ff.input, multiline && ff.multiline]}
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
  formFlex:       { flex: 1 },
  formShort:      { width: 100 },
  fieldGroup:     { gap: spacing.xs },
  fieldLabel:     { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  formActions:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  validationMsg:  {
    backgroundColor: '#FFF5F5', borderColor: '#FCA5A5',
    borderRadius: 6, borderWidth: 1, padding: 10,
  },
  validationText: { color: '#D32F2F', fontSize: 13, fontWeight: '600' },
  actionBtn:      { flex: 1 },

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

  colNome:   { flex: 2, paddingHorizontal: 4 },
  colArea:   { width: 120, paddingHorizontal: 4 },
  colVuln:   { width: 60,  paddingHorizontal: 4 },
  colStatus: { width: 80,  paddingHorizontal: 4 },
  colAcoes:  { width: 160, paddingHorizontal: 4 },
  actionsRow:{ flexDirection: 'row', gap: 8 },

  rowNome:     { color: colors.neutralText, fontSize: 13, fontWeight: '600' },
  rowNomeMuted:{ color: colors.mutedText },
  rowSub:      { color: colors.mutedText, fontSize: 11, marginTop: 1 },
  rowCell:     { color: colors.mutedText, fontSize: 13 },
  dash:        { color: colors.mutedText, fontSize: 13 },

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
  mobileCardTop:    { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  mobileCardMeta:   { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mobileCardActions:{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  tipoChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 99,
    color: '#3F51B5',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
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
