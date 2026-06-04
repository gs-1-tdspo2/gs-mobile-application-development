import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  nome: string;
  cidade: string;
  estado: string;
  tipoCliente: ClientType | '';
  descricao: string;
  ativo: boolean;
};

type Feedback = {
  type: 'success' | 'error';
  message: string;
};

const clientTypes: ClientType[] = ['Governo / Defesa Civil', 'ONG'];

const emptyForm: FormState = {
  nome: '',
  cidade: '',
  estado: '',
  tipoCliente: '',
  descricao: '',
  ativo: true,
};

export default function GerenciarRegioesScreen() {
  const [regioes, setRegioes] = useState<RegiaoReadModel[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingRegiao, setEditingRegiao] = useState<RegiaoReadModel | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { isDesktop } = useResponsiveLayout();

  const formTitle = editingRegiao ? 'Editar região' : 'Nova região';
  const submitLabel = isSaving
    ? 'Salvando...'
    : editingRegiao
      ? 'Salvar alterações'
      : 'Criar região';

  const sortedRegioes = useMemo(
    () => [...regioes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [regioes],
  );

  const loadRegioes = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const data = await getRegioes();
      setRegioes(data);
    } catch (error) {
      setRegioes([]);
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadRegioes());
  }, [loadRegioes]);

  function openCreateForm() {
    setEditingRegiao(null);
    setForm(emptyForm);
    setValidationMessage(null);
    setFeedback(null);
    setIsFormOpen(true);
  }

  function openEditForm(regiao: RegiaoReadModel) {
    setEditingRegiao(regiao);
    setForm({
      nome: regiao.nome,
      cidade: regiao.cidade ?? '',
      estado: regiao.estado ?? '',
      tipoCliente: normalizeClientType(regiao.tipoCliente),
      descricao: regiao.descricao ?? '',
      ativo: regiao.ativo ?? true,
    });
    setValidationMessage(null);
    setFeedback(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingRegiao(null);
    setForm(emptyForm);
    setValidationMessage(null);
    setIsFormOpen(false);
  }

  async function handleSubmit() {
    const validation = validateForm(form);

    if (validation) {
      setValidationMessage(validation);
      return;
    }

    setIsSaving(true);
    setValidationMessage(null);
    setFeedback(null);

    try {
      const payload = buildPayload(form);

      if (editingRegiao) {
        await updateRegiao(editingRegiao.id, payload as RegiaoUpdateRequest);
        setFeedback({ type: 'success', message: 'Região atualizada com sucesso.' });
      } else {
        await createRegiao(payload);
        setFeedback({ type: 'success', message: 'Região criada com sucesso.' });
      }

      closeForm();
      await loadRegioes(false);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: `Não foi possível salvar a região. ${getApiErrorMessage(error)}`,
      });
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete(regiao: RegiaoReadModel) {
    Alert.alert(
      'Excluir região',
      `Deseja excluir "${regiao.nome}"? Essa ação atualizará a base da operação.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void handleDelete(regiao);
          },
        },
      ],
    );
  }

  async function handleDelete(regiao: RegiaoReadModel) {
    setDeletingId(regiao.id);
    setFeedback(null);

    try {
      await deleteRegiao(regiao.id);
      setFeedback({ type: 'success', message: 'Região excluída com sucesso.' });
      await loadRegioes(false);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: `Não foi possível excluir a região. ${getApiErrorMessage(error)}`,
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell activeRoute="gerenciar">
      <SafeAreaView style={screenStyles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={[
              screenStyles.scrollContent,
              isDesktop && screenStyles.desktopScrollContent,
            ]}>
          <View style={[screenStyles.header, isDesktop && styles.desktopHeader]}>
            <View style={styles.headerCopy}>
              <Text style={screenStyles.title}>Gerenciar Regiões</Text>
              <Text style={screenStyles.subtitle}>
                Cadastro administrativo das regiões monitoradas pelo MVP Amanajé.
              </Text>
            </View>
            {isDesktop ? (
              <AppButton label="Nova Região" onPress={openCreateForm} style={styles.headerButton} />
            ) : null}
          </View>

          {feedback ? <InlineFeedback type={feedback.type} message={feedback.message} /> : null}

          <AppCard
            title="Ações rápidas"
            subtitle="Crie uma nova região ou atualize a lista operacional."
            variant="compact">
            <View style={styles.actionsRow}>
              {!isDesktop ? (
                <AppButton label="Nova Região" onPress={openCreateForm} style={styles.actionButton} />
              ) : null}
              <AppButton
                label="Atualizar"
                onPress={() => {
                  void loadRegioes();
                }}
                variant="secondary"
                style={styles.actionButton}
              />
            </View>
          </AppCard>

          {isFormOpen ? (
            <AppCard
              title={formTitle}
              subtitle="Campos marcados como obrigatórios são validados antes do envio."
              variant="elevated"
              style={isDesktop && styles.desktopFormCard}>
              <View style={styles.form}>
                {validationMessage ? (
                  <InlineFeedback type="error" message={validationMessage} />
                ) : null}

                <FormField
                  label="Nome da região *"
                  value={form.nome}
                  onChangeText={(value) => setForm((current) => ({ ...current, nome: value }))}
                  placeholder="Ex.: Região Ribeirinha Norte"
                />

                <FormField
                  label="Cidade *"
                  value={form.cidade}
                  onChangeText={(value) => setForm((current) => ({ ...current, cidade: value }))}
                  placeholder="Ex.: Manaus"
                />

                <FormField
                  label="Estado *"
                  value={form.estado}
                  onChangeText={(value) =>
                    setForm((current) => ({ ...current, estado: value.toUpperCase().slice(0, 2) }))
                  }
                  placeholder="UF"
                  autoCapitalize="characters"
                  maxLength={2}
                />

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Tipo de cliente *</Text>
                  <View style={styles.selectorRow}>
                    {clientTypes.map((type) => (
                      <FilterChip
                        key={type}
                        label={type}
                        selected={form.tipoCliente === type}
                        onPress={() => setForm((current) => ({ ...current, tipoCliente: type }))}
                      />
                    ))}
                  </View>
                </View>

                <FormField
                  label="Descrição da área vulnerável"
                  value={form.descricao}
                  onChangeText={(value) => setForm((current) => ({ ...current, descricao: value }))}
                  placeholder="Contexto ambiental, social ou climático da região"
                  multiline
                />

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.selectorRow}>
                    <FilterChip
                      label="Ativa"
                      selected={form.ativo}
                      onPress={() => setForm((current) => ({ ...current, ativo: true }))}
                    />
                    <FilterChip
                      label="Inativa"
                      selected={!form.ativo}
                      onPress={() => setForm((current) => ({ ...current, ativo: false }))}
                    />
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <AppButton
                    label={submitLabel}
                    onPress={() => {
                      void handleSubmit();
                    }}
                    disabled={isSaving}
                    style={styles.actionButton}
                  />
                  <AppButton
                    label="Cancelar"
                    onPress={closeForm}
                    variant="ghost"
                    disabled={isSaving}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            </AppCard>
          ) : null}

          {isLoading ? <LoadingState message="Carregando regiões para gerenciamento..." /> : null}

          {errorMessage ? <ErrorState message={errorMessage} onRetry={loadRegioes} /> : null}

          {!isLoading && !errorMessage && sortedRegioes.length === 0 ? (
            <EmptyState
            title="Nenhuma região cadastrada"
              description="Use a ação Nova Região para cadastrar a primeira área monitorada."
            />
          ) : null}

          {!isLoading && !errorMessage && sortedRegioes.length > 0 ? (
            <View style={[styles.list, isDesktop && styles.desktopList]}>
              {sortedRegioes.map((regiao) => (
                <AppCard
                  key={String(regiao.id)}
                  title={regiao.nome}
                  subtitle={regiao.descricao}
                  variant="compact"
                  style={isDesktop && styles.desktopListCard}>
                  <View style={[styles.cardContent, isDesktop && styles.desktopCardContent]}>
                    <View style={styles.regionMetaBlock}>
                      <Text style={styles.meta}>{formatLocation(regiao)}</Text>
                      <View style={styles.badges}>
                        {regiao.tipoCliente ? (
                          <View style={styles.clientBadge}>
                            <Text style={styles.clientBadgeText}>{regiao.tipoCliente}</Text>
                          </View>
                        ) : null}
                        {getStatusBadge(regiao) ? <StatusBadge status={getStatusBadge(regiao)!} /> : null}
                      </View>
                    </View>
                    <View style={styles.actionsRow}>
                      <AppButton
                        label="Editar"
                        onPress={() => openEditForm(regiao)}
                        variant="secondary"
                        style={styles.actionButton}
                      />
                      <AppButton
                        label={deletingId === regiao.id ? 'Excluindo...' : 'Excluir'}
                        onPress={() => confirmDelete(regiao)}
                        variant="danger"
                        disabled={deletingId === regiao.id}
                        style={styles.actionButton}
                      />
                    </View>
                  </View>
                </AppCard>
              ))}
            </View>
          ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppShell>
  );
}

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
  if (form.nome.trim().length < 3) {
    return 'Informe o nome da região com pelo menos 3 caracteres.';
  }

  if (form.cidade.trim().length < 2) {
    return 'Informe a cidade com pelo menos 2 caracteres.';
  }

  if (!form.estado.trim()) {
    return 'Informe o estado.';
  }

  if (form.estado.trim().length !== 2) {
    return 'Use o formato UF com 2 letras para o estado.';
  }

  if (!form.tipoCliente) {
    return 'Selecione o tipo de cliente.';
  }

  return null;
}

function normalizeClientType(value?: string): ClientType | '' {
  if (value === 'Governo / Defesa Civil' || value === 'ONG') {
    return value;
  }

  const normalized = value
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized?.includes('governo') || normalized?.includes('defesa civil')) {
    return 'Governo / Defesa Civil';
  }

  if (normalized?.includes('ong')) {
    return 'ONG';
  }

  return '';
}

function formatLocation(regiao: RegiaoReadModel): string {
  const location = [regiao.cidade, regiao.estado].filter(Boolean).join(' / ');
  return location || 'Localização não informada';
}

function getStatusBadge(regiao: RegiaoReadModel): 'Ativo' | 'Inativo' | undefined {
  if (regiao.ativo !== undefined) {
    return regiao.ativo ? 'Ativo' : 'Inativo';
  }

  const normalized = regiao.status
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized?.includes('ativo')) {
    return 'Ativo';
  }

  if (normalized?.includes('inativo')) {
    return 'Inativo';
  }

  return undefined;
}

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  autoCapitalize,
  maxLength,
}: FormFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
  );
}

function InlineFeedback({ type, message }: Feedback) {
  const isSuccess = type === 'success';

  return (
    <View style={[styles.feedback, isSuccess ? styles.successFeedback : styles.errorFeedback]}>
      <Text style={[styles.feedbackText, isSuccess ? styles.successText : styles.errorText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  desktopHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  headerButton: {
    minWidth: 160,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flexGrow: 1,
  },
  form: {
    gap: spacing.md,
  },
  desktopFormCard: {
    alignSelf: 'flex-start',
    maxWidth: 760,
    width: '100%',
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.neutralText,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  desktopList: {
    gap: spacing.md,
  },
  desktopListCard: {
    borderColor: '#D8DEEA',
  },
  cardContent: {
    gap: spacing.sm,
  },
  desktopCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  regionMetaBlock: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 280,
  },
  meta: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  clientBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clientBadgeText: {
    color: colors.primaryBase,
    fontSize: 12,
    fontWeight: '700',
  },
  feedback: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
  },
  successFeedback: {
    backgroundColor: colors.lowRiskBackground,
    borderColor: '#16A34A',
  },
  errorFeedback: {
    backgroundColor: colors.criticalSoftBackground,
    borderColor: colors.criticalRed,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  successText: {
    color: '#166534',
  },
  errorText: {
    color: colors.criticalRed,
  },
});
