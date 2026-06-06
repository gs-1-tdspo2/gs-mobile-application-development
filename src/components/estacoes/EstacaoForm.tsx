import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCreateEstacao } from '@hooks/useCreateEstacao';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import {
  TipoEstacaoLabels,
  StatusEstacaoLabels,
} from '@constants/enums';
import type { TipoEstacao, StatusEstacao } from '@constants/enums';
import type { RegiaoMonitorada } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  codigoEstacao: string;
  nome: string;
  tipoEstacao: TipoEstacao | '';
  statusEstacao: StatusEstacao;
  latitude: string;
  longitude: string;
}

interface FormErrors {
  codigoEstacao?: string;
  nome?: string;
  tipoEstacao?: string;
  latitude?: string;
  longitude?: string;
}

const INITIAL_FORM: FormState = {
  codigoEstacao: '',
  nome: '',
  tipoEstacao: '',
  statusEstacao: 'ATIVA',
  latitude: '',
  longitude: '',
};

// ─── Sensor profile data ──────────────────────────────────────────────────────

const SENSOR_PROFILES = [
  {
    icon: 'water-outline' as const,
    sensor: 'HC-SR04',
    label: 'Nível de água',
    category: 'Enchente',
    fields: 'distanciaAguaCm · nivelAguaPct',
    description: 'Sensor ultrassônico que mede a distância até a superfície da água.',
    color: '#1565C0',
    bg: '#E3F2FD',
  },
  {
    icon: 'trending-down-outline' as const,
    sensor: 'MPU6050',
    label: 'Inclinação e vibração',
    category: 'Deslizamento',
    fields: 'inclinacaoGraus · vibracao',
    description: 'Acelerômetro + giroscópio detecta inclinação e tremores no solo.',
    color: '#6A1B9A',
    bg: '#F3E5F5',
  },
  {
    icon: 'thunderstorm-outline' as const,
    sensor: 'BMP180',
    label: 'Pressão atmosférica',
    category: 'Tempestade',
    fields: 'pressaoHpa',
    description: 'Barômetro detecta quedas de pressão indicativas de tempestades.',
    color: '#E65100',
    bg: '#FFF3E0',
  },
  {
    icon: 'cloud-outline' as const,
    sensor: 'Slider → PMS5003',
    label: 'Qualidade do ar',
    category: 'Qualidade do ar',
    fields: 'pm25 · pm10',
    description: 'Potenciômetro simulando sensor de partículas PM2.5 e PM10 (Wokwi).',
    color: '#1B5E20',
    bg: '#E8F5E9',
  },
];

// ─── Tipo options ─────────────────────────────────────────────────────────────

const TIPO_OPTIONS: { value: TipoEstacao; description: string }[] = [
  { value: 'REAL', description: 'Hardware físico instalado em campo.' },
  { value: 'SIMULADA', description: 'Simulação Wokwi ou protótipo de bancada.' },
  { value: 'REFERENCIA', description: 'Estação de referência para calibração.' },
];

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: StatusEstacao; description: string; color: string }[] = [
  { value: 'ATIVA', description: 'Operando normalmente.', color: '#1B5E20' },
  { value: 'INATIVA', description: 'Desligada ou fora de operação.', color: '#616161' },
  { value: 'MANUTENCAO', description: 'Em manutenção programada.', color: '#E65100' },
  { value: 'FALHA', description: 'Falha detectada — requer intervenção.', color: '#D32F2F' },
  { value: 'SEM_COM', description: 'Sem comunicação com o servidor.', color: '#F57F17' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sugerirCodigo(regiao: RegiaoMonitorada, tipo: TipoEstacao | ''): string {
  const uf = regiao.estado.toUpperCase();
  const t = tipo === 'REAL' ? 'R' : tipo === 'SIMULADA' ? 'S' : tipo === 'REFERENCIA' ? 'REF' : 'X';
  const id = String(regiao.idRegiao).padStart(3, '0');
  return `AMANAJE-${uf}-${t}-${id}`;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.codigoEstacao.trim()) errors.codigoEstacao = 'Código da estação é obrigatório.';
  if (!form.nome.trim()) errors.nome = 'Nome da estação é obrigatório.';
  if (!form.tipoEstacao) errors.tipoEstacao = 'Selecione o tipo da estação.';
  if (form.latitude.trim()) {
    const lat = parseFloat(form.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) errors.latitude = 'Latitude inválida.';
  }
  if (form.longitude.trim()) {
    const lon = parseFloat(form.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) errors.longitude = 'Longitude inválida.';
  }
  return errors;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ letter, title }: { letter: string; title: string }) {
  return (
    <View style={sec.header}>
      <View style={sec.letter}>
        <Text style={sec.letterText}>{letter}</Text>
      </View>
      <Text style={sec.title}>{title}</Text>
    </View>
  );
}

const sec = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  letter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  regiao: RegiaoMonitorada;
  onClose: () => void;
  onSuccess: () => void;
}

export function EstacaoForm({ visible, regiao, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const { execute, status, error: apiError, reset } = useCreateEstacao();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 768;

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }, []);

  const handleSugerir = useCallback(() => {
    const suggestion = sugerirCodigo(regiao, form.tipoEstacao);
    set('codigoEstacao', suggestion);
  }, [regiao, form.tipoEstacao, set]);

  const handleClose = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSubmit = useCallback(async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (!form.tipoEstacao) return;

    const payload = {
      idRegiao: regiao.idRegiao,
      codigoEstacao: form.codigoEstacao.trim(),
      nome: form.nome.trim(),
      tipoEstacao: form.tipoEstacao,
      statusEstacao: form.statusEstacao,
      ...(form.latitude.trim() ? { latitude: parseFloat(form.latitude) } : {}),
      ...(form.longitude.trim() ? { longitude: parseFloat(form.longitude) } : {}),
    };

    const result = await execute(payload);
    if (result) {
      setForm(INITIAL_FORM);
      setErrors({});
      reset();
      onSuccess();
    }
  }, [form, regiao, execute, reset, onSuccess]);

  const isLoading = status === 'loading';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header bar */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            disabled={isLoading}
            activeOpacity={0.75}
          >
            <Ionicons name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nova Estação IoT</Text>
          <TouchableOpacity
            style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Cadastrar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, isWide && styles.contentWide]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* API error banner */}
          {!!apiError && (
            <View style={styles.apiErrorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#B71C1C" />
              <Text style={styles.apiErrorText}>
                Não foi possível cadastrar a estação.{apiError ? ` ${apiError}` : ''}
              </Text>
            </View>
          )}

          {/* ── Section A: Região vinculada ─────────────────────────── */}
          <SectionHeader letter="A" title="Região vinculada" />
          <View style={styles.regionCard}>
            <View style={styles.regionCardRow}>
              <Ionicons name="location" size={18} color={Colors.primary} />
              <View style={styles.regionCardText}>
                <Text style={styles.regionName}>{regiao.nome}</Text>
                <Text style={styles.regionSub}>{regiao.cidade} · {regiao.estado}</Text>
              </View>
            </View>
          </View>

          {/* ── Section B: Identificação ────────────────────────────── */}
          <SectionHeader letter="B" title="Identificação da estação" />

          <Text style={styles.fieldLabel}>Código da estação *</Text>
          <View style={styles.codeRow}>
            <TextInput
              style={[
                styles.input,
                styles.codeInput,
                !!errors.codigoEstacao && styles.inputError,
              ]}
              value={form.codigoEstacao}
              onChangeText={v => set('codigoEstacao', v.toUpperCase())}
              placeholder="Ex.: AMANAJE-SP-R-001"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.suggestBtn}
              onPress={handleSugerir}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles-outline" size={15} color={Colors.primary} />
              <Text style={styles.suggestBtnText}>Sugerir</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Use um código único — ex.: AMANAJE-SP-RP-001. O botão "Sugerir" gera uma sugestão editável baseada na região e tipo.
          </Text>
          {!!errors.codigoEstacao && <Text style={styles.errorText}>{errors.codigoEstacao}</Text>}

          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Nome da estação *</Text>
          <TextInput
            style={[styles.input, !!errors.nome && styles.inputError]}
            value={form.nome}
            onChangeText={v => set('nome', v)}
            placeholder="Ex.: Estação Ponte Ipiranga Arroio Dilúvio"
            placeholderTextColor={Colors.textMuted}
            editable={!isLoading}
          />
          {!!errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

          {/* ── Section C: Tipo de estação ──────────────────────────── */}
          <SectionHeader letter="C" title="Tipo de estação" />
          {errors.tipoEstacao && <Text style={styles.errorText}>{errors.tipoEstacao}</Text>}
          <View style={styles.optionGrid}>
            {TIPO_OPTIONS.map(opt => {
              const active = form.tipoEstacao === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => set('tipoEstacao', opt.value)}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {TipoEstacaoLabels[opt.value]}
                  </Text>
                  <Text style={[styles.optionDesc, active && styles.optionDescActive]}>
                    {opt.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Section D: Status operacional ──────────────────────── */}
          <SectionHeader letter="D" title="Status operacional" />
          <View style={styles.optionGrid}>
            {STATUS_OPTIONS.map(opt => {
              const active = form.statusEstacao === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionCard,
                    active && { ...styles.optionCardActive, borderColor: opt.color },
                  ]}
                  onPress={() => set('statusEstacao', opt.value)}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionRow}>
                    <View style={[styles.statusDot, { backgroundColor: opt.color }]} />
                    <Text style={[styles.optionLabel, active && { color: opt.color }]}>
                      {StatusEstacaoLabels[opt.value]}
                    </Text>
                  </View>
                  <Text style={[styles.optionDesc, active && styles.optionDescActive]}>
                    {opt.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Section E: Coordenadas opcionais ───────────────────── */}
          <SectionHeader letter="E" title="Coordenadas opcionais" />
          <Text style={styles.sectionNote}>
            Latitude e longitude permitem localizar a estação no mapa. Deixe em branco se desconhecidas.
          </Text>
          <View style={[styles.coordRow, isWide && styles.coordRowWide]}>
            <View style={styles.coordField}>
              <Text style={styles.fieldLabel}>Latitude</Text>
              <TextInput
                style={[styles.input, !!errors.latitude && styles.inputError]}
                value={form.latitude}
                onChangeText={v => set('latitude', v)}
                placeholder="-23.5505"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                editable={!isLoading}
              />
              {!!errors.latitude && <Text style={styles.errorText}>{errors.latitude}</Text>}
            </View>
            <View style={styles.coordField}>
              <Text style={styles.fieldLabel}>Longitude</Text>
              <TextInput
                style={[styles.input, !!errors.longitude && styles.inputError]}
                value={form.longitude}
                onChangeText={v => set('longitude', v)}
                placeholder="-46.6333"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                editable={!isLoading}
              />
              {!!errors.longitude && <Text style={styles.errorText}>{errors.longitude}</Text>}
            </View>
          </View>

          {/* ── Section F: Perfil de sensores ──────────────────────── */}
          <SectionHeader letter="F" title="Perfil de sensores associado" />
          <View style={styles.sensorDisclaimer}>
            <Ionicons name="information-circle-outline" size={15} color={Colors.primary} />
            <Text style={styles.sensorDisclaimerText}>
              Planejamento de implantação — orientativo apenas. Os módulos de sensor não são persistidos com a estação. Este perfil descreve os sensores compatíveis com o Amanajé IoT.
            </Text>
          </View>
          <View style={[styles.sensorGrid, isWide && styles.sensorGridWide]}>
            {SENSOR_PROFILES.map(s => (
              <View key={s.sensor} style={[styles.sensorCard, { borderTopColor: s.color }]}>
                <View style={styles.sensorCardHeader}>
                  <View style={[styles.sensorIconWrap, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon} size={18} color={s.color} />
                  </View>
                  <View style={styles.sensorCardText}>
                    <Text style={[styles.sensorName, { color: s.color }]}>{s.sensor}</Text>
                    <Text style={styles.sensorCategory}>{s.category}</Text>
                  </View>
                </View>
                <Text style={styles.sensorDesc}>{s.description}</Text>
                <View style={styles.sensorFields}>
                  <Ionicons name="pulse-outline" size={11} color={Colors.textMuted} />
                  <Text style={styles.sensorFieldsText}>{s.fields}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Modal header bar
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    padding: Spacing.xs,
    borderRadius: Radius.sm,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.md,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  contentWide: {
    maxWidth: 720,
    alignSelf: 'center' as const,
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },

  // API error banner
  apiErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  apiErrorText: {
    fontSize: FontSize.sm,
    color: '#B71C1C',
    flex: 1,
  },

  // Section A: region card
  regionCard: {
    backgroundColor: '#EEF0FB',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  regionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  regionCardText: {
    flex: 1,
  },
  regionName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  regionSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Field inputs
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 44,
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  codeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    letterSpacing: 0.5,
  },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    height: 44,
    backgroundColor: '#EEF0FB',
  },
  suggestBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  helperText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    lineHeight: 17,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: '#D32F2F',
    marginTop: 3,
    fontWeight: '500',
  },

  // Option grid (tipo / status)
  optionGrid: {
    gap: Spacing.xs,
  },
  optionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF0FB',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  optionLabelActive: {
    color: Colors.primary,
  },
  optionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  optionDescActive: {
    color: Colors.primary + 'BB',
  },

  // Section note
  sectionNote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    lineHeight: 17,
  },

  // Coordinate row
  coordRow: {
    gap: Spacing.sm,
  },
  coordRowWide: {
    flexDirection: 'row',
  },
  coordField: {
    flex: 1,
  },

  // Sensor disclaimer
  sensorDisclaimer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'flex-start',
    backgroundColor: '#EEF0FB',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sensorDisclaimerText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    flex: 1,
    lineHeight: 17,
  },

  // Sensor grid
  sensorGrid: {
    gap: Spacing.sm,
  },
  sensorGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sensorCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    flex: 1,
    minWidth: 160,
  },
  sensorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sensorIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorCardText: {
    flex: 1,
  },
  sensorName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  sensorCategory: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  sensorDesc: {
    fontSize: FontSize.xs,
    color: Colors.text,
    lineHeight: 17,
    marginBottom: Spacing.xs,
  },
  sensorFields: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sensorFieldsText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  bottomPad: {
    height: Spacing.xxl,
  },
});
