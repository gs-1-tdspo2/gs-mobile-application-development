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

type ClientType = 'Governo / Defesa Civil' | 'ONG';
type FormState = {
  nome: string; cidade: string; estado: string;
  tipoCliente: ClientType | ''; descricao: string; ativo: boolean;
};
type Feedback = { ok: boolean; msg: string };

const CLIENT_TYPES: ClientType[] = ['Governo / Defesa Civil', 'ONG'];

const EMPTY_FORM: FormState = {
  nome: '', cidade: '', estado: '', tipoCliente: '', descricao: '', ativo: true,
};

export default function GerenciarRegioesScreen() {
  const [regioes, setRegioes] = useState<RegiaoReadModel[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<RegiaoReadModel | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { isDesktop } = useResponsiveLayout();

  const formTitle = editing ? 'Editar Região' : 'Nova Região';
  const submitLabel = isSaving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar região';

  const sorted = useMemo(
    () => [...regioes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [regioes],
  );

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
      nome: r.nome,
      cidade: r.cidade ?? '',
      estado: r.estado ?? '',
      tipoCliente: normalizeClient(r.tipoCliente),
      descricao: r.descricao ?? '',
      ativo: r.ativo ?? true,
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
            <View style={[styles.head, isDesktop && styles.headDesktop]}>
              <View style={styles.headText}>
                <Text style={styles.eyebrow}>ADMINISTRAÇÃO</Text>
                <Text style={styles.title}>Gerenciar Regiões</Text>
                <Text style={styles.subtitle}>Cadastro administrativo das regiões monitoradas.</Text>
              </View>
              {isDesktop ? (
                <AppButton label="+ Nova Região" onPress={openCreate} style={styles.newBtn} />
              ) : null}
            </View>

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
                <AppButton label="+ Nova Região" onPress={openCreate} style={styles.actionBtn} />
                <AppButton
                  label="Atualizar"
                  onPress={() => { void loadRegioes(); }}
                  variant="secondary"
                  style={styles.actionBtn}
                />
              </View>
            ) : null}

            {/* ── Inline form panel ────────────────────── */}
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

            {/* ── List ─────────────────────────────────── */}
            {isLoading ? <LoadingState message="Carregando regiões..." /> : null}
            {error ? <ErrorState message={error} onRetry={loadRegioes} /> : null}

            {!isLoading && !error && sorted.length === 0 ? (
              <EmptyState title="Nenhuma região cadastrada" description="Crie a primeira região acima." />
            ) : null}

            {!isLoading && !error && sorted.length > 0 ? (
              <View style={styles.tableContainer}>
                {isDesktop ? (
                  <View style={styles.tableHead}>
                    <Text style={[styles.th, styles.colNome]}>REGIÃO</Text>
                    <Text style={[styles.th, styles.colLocal]}>LOCALIZAÇÃO</Text>
                    <Text style={[styles.th, styles.colTipo]}>TIPO</Text>
                    <Text style={[styles.th, styles.colStatus]}>STATUS</Text>
                    <Text style={[styles.th, styles.colAcoes]}>AÇÕES</Text>
                  </View>
                ) : null}

                {sorted.map((r) => (
                  isDesktop ? (
                    <View key={String(r.id)} style={styles.tableRow}>
                      <View style={styles.colNome}>
                        <Text style={styles.rowNome}>{r.nome}</Text>
                        {r.descricao ? <Text style={styles.rowDesc} numberOfLines={1}>{r.descricao}</Text> : null}
                      </View>
                      <Text style={[styles.rowCell, styles.colLocal]}>{fmtLocal(r)}</Text>
                      <Text style={[styles.rowCell, styles.colTipo]}>{r.tipoCliente ?? '—'}</Text>
                      <View style={styles.colStatus}>
                        {getStatus(r) ? <StatusBadge status={getStatus(r)!} /> : null}
                      </View>
                      <View style={[styles.colAcoes, styles.actionsInline]}>
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
                    <View key={String(r.id)} style={styles.mobileCard}>
                      <View style={styles.mobileCardTop}>
                        <Text style={styles.rowNome}>{r.nome}</Text>
                        {getStatus(r) ? <StatusBadge status={getStatus(r)!} /> : null}
                      </View>
                      <Text style={styles.rowCell}>{fmtLocal(r)}</Text>
                      {r.tipoCliente ? <Text style={styles.rowCell}>{r.tipoCliente}</Text> : null}
                      <View style={styles.mobileCardActions}>
                        <AppButton label="Editar"  onPress={() => openEdit(r)}   variant="secondary" style={styles.actionBtn} />
                        <AppButton
                          label={deletingId === r.id ? 'Excluindo...' : 'Excluir'}
                          onPress={() => confirmDelete(r)}
                          variant="danger"
                          disabled={deletingId === r.id}
                          style={styles.actionBtn}
                        />
                      </View>
                    </View>
                  )
                ))}
              </View>
            ) : null}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppShell>
  );
}

/* ── Form field ───────────────────────────────────────── */

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

const ff = StyleSheet.create({
  group: { gap: 4 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  input: {
    backgroundColor: '#FAFAFA',
    borderColor: '#DDE1EA',
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

/* ── Helpers ──────────────────────────────────────────── */

function buildPayload(form: FormState): RegiaoCreateRequest {
  return {
    nome: form.nome.trim(),
    cidade: form.cidade.trim(),
    estado: form.estado.trim().toUpperCase(),
    tipoCliente: form.tipoCliente,
    descricao: form.descricao.trim() || undefined,
    ativo: form.ativo,
  };
}

function validateForm(form: FormState): string | null {
  if (form.nome.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres.';
  if (form.cidade.trim().length < 2) return 'Informe a cidade.';
  if (!form.estado.trim()) return 'Informe o estado (UF).';
  if (form.estado.trim().length !== 2) return 'Estado deve ter 2 letras (UF).';
  if (!form.tipoCliente) return 'Selecione o tipo de cliente.';
  return null;
}

function normalizeClient(v?: string): ClientType | '' {
  if (v === 'Governo / Defesa Civil' || v === 'ONG') return v;
  const n = v?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() ?? '';
  if (n.includes('governo') || n.includes('defesa')) return 'Governo / Defesa Civil';
  if (n.includes('ong')) return 'ONG';
  return '';
}

function fmtLocal(r: RegiaoReadModel): string {
  return [r.cidade, r.estado].filter(Boolean).join(' / ') || '—';
}

function getStatus(r: RegiaoReadModel): 'Ativo' | 'Inativo' | undefined {
  if (r.ativo !== undefined) return r.ativo ? 'Ativo' : 'Inativo';
  const n = r.status?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() ?? '';
  if (n.includes('ativo')) return 'Ativo';
  if (n.includes('inativo')) return 'Inativo';
  return undefined;
}

/* ── Styles ───────────────────────────────────────────── */

const styles = StyleSheet.create({
  kav: { flex: 1 },

  head: { gap: spacing.xs },
  headDesktop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  headText: { flex: 1, gap: 2 },
  eyebrow: { color: colors.primary500, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  title: { color: colors.neutralText, fontSize: 22, fontWeight: '700' },
  subtitle: { color: colors.mutedText, fontSize: 13, lineHeight: 18, marginTop: 2 },
  newBtn: { minWidth: 150 },

  toast: { borderRadius: 6, borderWidth: 1, padding: 12 },
  toastOk: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  toastErr: { backgroundColor: '#FFF5F5', borderColor: '#FCA5A5' },
  toastText: { fontSize: 13, fontWeight: '600' },
  toastTextOk: { color: '#166534' },
  toastTextErr: { color: '#D32F2F' },

  mobileActions: { flexDirection: 'row', gap: spacing.sm },
  formCard: { alignSelf: 'flex-start', maxWidth: 720, width: '100%' },
  form: { gap: spacing.md },
  formRow: { gap: spacing.md },
  formRowDesktop: { flexDirection: 'row' },
  formFlex: { flex: 1 },
  formShort: { width: 100 },
  fieldGroup: { gap: spacing.xs },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  formActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  validationMsg: {
    backgroundColor: '#FFF5F5', borderColor: '#FCA5A5', borderRadius: 6,
    borderWidth: 1, padding: 10,
  },
  validationText: { color: '#D32F2F', fontSize: 13, fontWeight: '600' },
  actionBtn: { flex: 1 },

  tableContainer: {
    backgroundColor: colors.surface, borderColor: '#DDE1EA', borderRadius: 8,
    borderWidth: 1, overflow: 'hidden',
  },
  tableHead: {
    alignItems: 'center', backgroundColor: '#F8F9FB',
    borderBottomColor: '#DDE1EA', borderBottomWidth: 1,
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
  },
  th: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 4 },
  tableRow: {
    alignItems: 'center', borderBottomColor: '#EEF0F4', borderBottomWidth: 1,
    flexDirection: 'row', minHeight: 52, paddingHorizontal: 16, paddingVertical: 8,
  },
  colNome: { flex: 2, paddingHorizontal: 4 },
  colLocal: { flex: 1, paddingHorizontal: 4 },
  colTipo: { width: 160, paddingHorizontal: 4 },
  colStatus: { width: 90, paddingHorizontal: 4 },
  colAcoes: { width: 160, paddingHorizontal: 4 },
  actionsInline: { flexDirection: 'row', gap: 8 },
  rowNome: { color: colors.neutralText, fontSize: 13, fontWeight: '600' },
  rowDesc: { color: colors.mutedText, fontSize: 11 },
  rowCell: { color: colors.mutedText, fontSize: 13, paddingHorizontal: 4 },

  editBtn: {
    borderColor: '#C5CAE9', borderRadius: 4, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  editBtnHover: { backgroundColor: '#EEF2FF' },
  editBtnText: { color: '#3F51B5', fontSize: 12, fontWeight: '600' },
  deleteBtn: {
    borderColor: '#FECACA', borderRadius: 4, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  deleteBtnHover: { backgroundColor: '#FFF5F5' },
  deleteBtnText: { color: '#D32F2F', fontSize: 12, fontWeight: '600' },

  mobileCard: {
    backgroundColor: colors.surface, borderColor: '#DDE1EA',
    borderRadius: 8, borderWidth: 1, gap: 6, margin: 8, padding: 14,
  },
  mobileCardTop: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  mobileCardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: 6 },
});
