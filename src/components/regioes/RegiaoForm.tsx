import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClientes } from '@hooks/useClientes';
import { Colors, RiskColors, RiskBackgrounds } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import { TipoAreaLabels, TipoClienteLabels, VisibilidadeLabels } from '@constants/enums';
import type { TipoArea, Visibilidade } from '@constants/enums';
import type { CreateRegiaoRequest } from '@/types';

// ─── Vulnerability presets ────────────────────────────────────────────────────

const VUL_OPTIONS = [
  { label: 'Baixa',    value: 20, color: RiskColors.BAIXO,    bg: RiskBackgrounds.BAIXO    },
  { label: 'Moderada', value: 45, color: RiskColors.MODERADO, bg: RiskBackgrounds.MODERADO },
  { label: 'Alta',     value: 70, color: RiskColors.ALTO,     bg: RiskBackgrounds.ALTO     },
  { label: 'Crítica',  value: 90, color: RiskColors.CRITICO,  bg: RiskBackgrounds.CRITICO  },
] as const;

// ─── Location presets ─────────────────────────────────────────────────────────

interface LocationPreset {
  id: string;
  label: string;
  sublabel: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  tipoArea: TipoArea;
  vulIndex: number;
  icon: string;
}

const LOCATION_PRESETS: LocationPreset[] = [
  {
    id: 'arroio_diluvio',
    label: 'Arroio Dilúvio',
    sublabel: 'Ponte Ipiranga · Porto Alegre, RS',
    cidade: 'Porto Alegre', estado: 'RS',
    latitude: -30.0507, longitude: -51.1834,
    tipoArea: 'PONTE', vulIndex: 2,
    icon: 'construct-outline',
  },
  {
    id: 'educandos',
    label: 'Com. Ribeirinha Educandos',
    sublabel: 'Manaus, AM',
    cidade: 'Manaus', estado: 'AM',
    latitude: -3.1333, longitude: -60.0151,
    tipoArea: 'REGIAO_RIBEIRINHA', vulIndex: 3,
    icon: 'water-outline',
  },
  {
    id: 'ribeirao_preto',
    label: 'Campus Climático',
    sublabel: 'Ribeirão Preto, SP',
    cidade: 'Ribeirão Preto', estado: 'SP',
    latitude: -21.1775, longitude: -47.8103,
    tipoArea: 'AREA_URBANA', vulIndex: 1,
    icon: 'business-outline',
  },
  {
    id: 'cais_maua',
    label: 'Cais Mauá',
    sublabel: 'Encosta · Porto Alegre, RS',
    cidade: 'Porto Alegre', estado: 'RS',
    latitude: -30.0777, longitude: -51.1816,
    tipoArea: 'ENCOSTA', vulIndex: 1,
    icon: 'triangle-outline',
  },
];

// ─── Sensor plan ──────────────────────────────────────────────────────────────

type SensorKey = 'HC_SR04' | 'MPU6050' | 'BMP180' | 'PMS5003';

interface SensorDef {
  label: string;
  dimension: string;
  telemetry: string;
  isReal: boolean;
  icon: string;
}

const SENSORS: Record<SensorKey, SensorDef> = {
  HC_SR04:  { label: 'HC-SR04',               dimension: 'Enchente',        telemetry: 'Nível de água / distância (cm)', isReal: true,  icon: 'water-outline'        },
  MPU6050:  { label: 'MPU6050',               dimension: 'Deslizamento',    telemetry: 'Inclinação (°), vibração',       isReal: true,  icon: 'trending-down-outline' },
  BMP180:   { label: 'BMP180',                dimension: 'Tempestade',      telemetry: 'Pressão atmosférica (hPa)',      isReal: true,  icon: 'thunderstorm-outline' },
  PMS5003:  { label: 'Slider — sim. PMS5003', dimension: 'Qualidade do ar', telemetry: 'PM2.5, PM10',                   isReal: false, icon: 'cloud-outline'        },
};

const ALL_SENSOR_KEYS: SensorKey[] = ['HC_SR04', 'MPU6050', 'BMP180', 'PMS5003'];

const AREA_SENSOR_DEFAULTS: Record<TipoArea, SensorKey[]> = {
  PONTE:               ['HC_SR04', 'MPU6050'],
  ENCOSTA:             ['MPU6050', 'HC_SR04'],
  REGIAO_RIBEIRINHA:   ['HC_SR04', 'BMP180'],
  AREA_URBANA:         ['BMP180',  'PMS5003'],
  AREA_RURAL:          ['BMP180',  'PMS5003'],
  COMUNIDADE:          ['HC_SR04', 'PMS5003', 'BMP180'],
  PROPRIEDADE_PRIVADA: ['BMP180',  'PMS5003'],
  OUTRA:               [],
};

const VISIBILIDADE_OPTIONS: Visibilidade[] = ['PRIVADA', 'INSTITUCIONAL', 'AGREGADA_PUBLICA'];

const TIPO_AREA_OPTIONS: TipoArea[] = [
  'PONTE', 'ENCOSTA', 'AREA_RURAL', 'COMUNIDADE',
  'PROPRIEDADE_PRIVADA', 'REGIAO_RIBEIRINHA', 'AREA_URBANA', 'OUTRA',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nivelToVulIndex(nivel: number): number {
  if (nivel >= 75) return 3;
  if (nivel >= 50) return 2;
  if (nivel >= 25) return 1;
  return 0;
}

interface PreviewRowProps { label: string; value: string; valueColor?: string }
function PreviewRow({ label, value, valueColor }: PreviewRowProps) {
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={[styles.previewValue, valueColor ? { color: valueColor } : undefined]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  idCliente: number | null;
  nome: string;
  cidade: string;
  estado: string;
  latitude: string;
  longitude: string;
  tipoArea: TipoArea | null;
  vulIndex: number;
  tipoVisibilidade: Visibilidade | null;
  showAdvancedCoords: boolean;
  selectedSensors: SensorKey[];
}

function initForm(initial?: Partial<CreateRegiaoRequest>): FormState {
  const tipoArea = initial?.tipoArea ?? null;
  return {
    idCliente:          initial?.idCliente ?? null,
    nome:               initial?.nome ?? '',
    cidade:             initial?.cidade ?? '',
    estado:             initial?.estado ?? '',
    latitude:           initial?.latitude  != null ? String(initial.latitude)  : '',
    longitude:          initial?.longitude != null ? String(initial.longitude) : '',
    tipoArea,
    vulIndex:           initial?.nivelVulnerabilidade != null
                          ? nivelToVulIndex(initial.nivelVulnerabilidade)
                          : 1,
    tipoVisibilidade:   initial?.tipoVisibilidade ?? null,
    showAdvancedCoords: false,
    selectedSensors:    tipoArea ? AREA_SENSOR_DEFAULTS[tipoArea] : [],
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RegiaoFormProps {
  initialValues?: Partial<CreateRegiaoRequest>;
  onSubmit: (data: CreateRegiaoRequest) => void;
  isLoading: boolean;
  error: string | null;
  submitLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RegiaoForm({
  initialValues,
  onSubmit,
  isLoading,
  error,
  submitLabel = 'Salvar região',
}: RegiaoFormProps) {
  const { data: clientes, status: clientesStatus, load: loadClientes } = useClientes();
  const [form, setForm] = useState<FormState>(() => initForm(initialValues));
  const [pickerVisible, setPickerVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  useEffect(() => { loadClientes(); }, [loadClientes]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setValidationError(null);
  }, []);

  const handlePresetSelect = useCallback((preset: LocationPreset) => {
    setForm(prev => ({
      ...prev,
      cidade:            preset.cidade,
      estado:            preset.estado,
      latitude:          String(preset.latitude),
      longitude:         String(preset.longitude),
      tipoArea:          preset.tipoArea,
      vulIndex:          preset.vulIndex,
      showAdvancedCoords: false,
      selectedSensors:   AREA_SENSOR_DEFAULTS[preset.tipoArea],
    }));
    setValidationError(null);
  }, []);

  const handleTipoAreaChange = useCallback((tipo: TipoArea) => {
    setForm(prev => ({
      ...prev,
      tipoArea:        tipo,
      selectedSensors: AREA_SENSOR_DEFAULTS[tipo],
    }));
    setValidationError(null);
  }, []);

  const toggleSensor = useCallback((key: SensorKey) => {
    setForm(prev => {
      const has = prev.selectedSensors.includes(key);
      return {
        ...prev,
        selectedSensors: has
          ? prev.selectedSensors.filter(k => k !== key)
          : [...prev.selectedSensors, key],
      };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const errs: string[] = [];
    if (!form.idCliente)         errs.push('Selecione um cliente responsável.');
    if (!form.nome.trim())       errs.push('Nome da região é obrigatório.');
    if (!form.cidade.trim())     errs.push('Cidade é obrigatória.');
    if (!/^[A-Z]{2}$/.test(form.estado))
      errs.push('Estado deve ser 2 letras maiúsculas (ex: SP, RJ).');
    if (!form.latitude || !form.longitude) {
      errs.push('Selecione uma sugestão de local ou informe coordenadas avançadas.');
    } else {
      const lat = parseFloat(form.latitude);
      const lon = parseFloat(form.longitude);
      if (isNaN(lat) || lat < -90  || lat > 90)  errs.push('Latitude inválida — deve ser entre -90 e 90.');
      if (isNaN(lon) || lon < -180 || lon > 180) errs.push('Longitude inválida — deve ser entre -180 e 180.');
    }
    if (!form.tipoArea)          errs.push('Selecione o tipo de área monitorada.');
    if (!form.tipoVisibilidade)  errs.push('Selecione a visibilidade dos dados.');

    if (errs.length > 0) { setValidationError(errs.join('\n')); return; }

    onSubmit({
      idCliente:            form.idCliente!,
      nome:                 form.nome.trim(),
      cidade:               form.cidade.trim(),
      estado:               form.estado,
      latitude:             parseFloat(form.latitude),
      longitude:            parseFloat(form.longitude),
      tipoArea:             form.tipoArea!,
      nivelVulnerabilidade: VUL_OPTIONS[form.vulIndex].value,
      tipoVisibilidade:     form.tipoVisibilidade!,
    });
  }, [form, onSubmit]);

  // ─── Computed ────────────────────────────────────────────────────────────────
  const selectedCliente = clientes.find(c => c.idCliente === form.idCliente);
  const hasCoords = form.latitude !== '' && form.longitude !== '';
  const vul = VUL_OPTIONS[form.vulIndex];

  // ─── Technical preview (rendered in right column desktop / bottom mobile) ───
  function renderPreview() {
    return (
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Ionicons name="code-working-outline" size={16} color={Colors.primary} />
          <Text style={styles.previewTitle}>Prévia técnica — API</Text>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTag}>PAYLOAD DA REGIÃO</Text>
          <PreviewRow label="Cliente"        value={selectedCliente?.nome ?? '—'} />
          <PreviewRow label="Nome"           value={form.nome || '—'} />
          <PreviewRow label="Cidade / UF"
            value={form.cidade && form.estado ? `${form.cidade}, ${form.estado}` : '—'} />
          <PreviewRow label="Coordenadas"
            value={hasCoords ? `${form.latitude}, ${form.longitude}` : '—'} />
          <PreviewRow label="Tipo de área"
            value={form.tipoArea ? TipoAreaLabels[form.tipoArea] : '—'} />
          <PreviewRow label="Vulnerabilidade"
            value={`${vul.label} · ${vul.value}/100`}
            valueColor={vul.color} />
          <PreviewRow label="Visibilidade"
            value={form.tipoVisibilidade ? VisibilidadeLabels[form.tipoVisibilidade] : '—'} />
        </View>

        <View style={styles.previewSectionNote}>
          <Text style={styles.previewSectionTag}>SENSORES (não enviados à API)</Text>
          <Text style={styles.previewSensorList}>
            {form.selectedSensors.length === 0
              ? 'Nenhum sensor selecionado'
              : form.selectedSensors.map(k => SENSORS[k].label).join(' · ')}
          </Text>
          <Text style={styles.previewSensorDisclaimer}>
            Cadastre as estações após criar a região.
          </Text>
        </View>
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={isDesktop ? styles.desktopLayout : undefined}>

            {/* ── Left / single form column ── */}
            <View style={isDesktop ? styles.formColumn : undefined}>

              {/* A. Cliente responsável */}
              <Text style={styles.sectionLabel}>A. Cliente responsável</Text>
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => setPickerVisible(true)}
                activeOpacity={0.75}
              >
                <View style={styles.pickerLeft}>
                  <Ionicons name="business-outline" size={18} color={Colors.primary} />
                  <Text
                    style={form.idCliente ? styles.pickerText : styles.pickerPlaceholder}
                    numberOfLines={1}
                  >
                    {selectedCliente
                      ? `${selectedCliente.nome}${TipoClienteLabels[selectedCliente.tipoCliente] ? ` — ${TipoClienteLabels[selectedCliente.tipoCliente]}` : ''}`
                      : clientesStatus === 'loading'
                      ? 'Carregando clientes…'
                      : 'Selecionar cliente responsável'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
              {clientes.length === 0 && clientesStatus === 'success' && (
                <Text style={styles.hint}>
                  Nenhum cliente cadastrado. É necessário ter ao menos um cliente para criar uma região.
                </Text>
              )}

              {/* B. Identificação da região */}
              <Text style={styles.sectionLabel}>B. Identificação da região</Text>
              <Text style={styles.fieldLabel}>Nome da região monitorada</Text>
              <TextInput
                style={styles.input}
                value={form.nome}
                onChangeText={v => set('nome', v)}
                placeholder="Ex: Ponte sobre o Arroio Dilúvio"
                placeholderTextColor={Colors.textMuted}
                maxLength={150}
                returnKeyType="next"
              />

              {/* C. Local monitorado */}
              <Text style={styles.sectionLabel}>C. Local monitorado</Text>
              <Text style={styles.subLabel}>Sugestões para demonstração</Text>

              <View style={styles.presetGrid}>
                {LOCATION_PRESETS.map(preset => {
                  const pv = VUL_OPTIONS[preset.vulIndex];
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={styles.presetCard}
                      onPress={() => handlePresetSelect(preset)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.presetAccent, { backgroundColor: pv.color }]} />
                      <View style={styles.presetBody}>
                        <View style={styles.presetTopRow}>
                          <Ionicons name={preset.icon as 'construct-outline'} size={14} color={pv.color} />
                          <Text style={[styles.presetVulLabel, { color: pv.color }]}>{pv.label}</Text>
                        </View>
                        <Text style={styles.presetName} numberOfLines={1}>{preset.label}</Text>
                        <Text style={styles.presetSub} numberOfLines={2}>{preset.sublabel}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Location summary card */}
              {hasCoords ? (
                <View style={styles.locationCard}>
                  <Text style={styles.locationCardTitle}>Local técnico configurado</Text>
                  <View style={styles.locationCityRow}>
                    <Ionicons name="location-outline" size={15} color={Colors.primary} />
                    <Text style={styles.locationCityText}>
                      {form.cidade || '—'}, {form.estado || '—'}
                    </Text>
                  </View>
                  <Text style={styles.locationCoords}>
                    {form.latitude}, {form.longitude}
                  </Text>
                  <Text style={styles.locationNote}>
                    Coordenadas usadas para integração climática e análise territorial.
                  </Text>
                  <TouchableOpacity
                    style={styles.locationToggle}
                    onPress={() => set('showAdvancedCoords', !form.showAdvancedCoords)}
                  >
                    <Ionicons
                      name={form.showAdvancedCoords ? 'chevron-up' : 'settings-outline'}
                      size={13}
                      color={Colors.primary}
                    />
                    <Text style={styles.locationToggleText}>
                      {form.showAdvancedCoords
                        ? 'Fechar coordenadas avançadas'
                        : 'Editar coordenadas avançadas'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.locationCardEmpty}>
                  <Ionicons name="location-outline" size={20} color={Colors.textMuted} />
                  <Text style={styles.locationEmptyText}>
                    Selecione uma sugestão de local ou informe as coordenadas manualmente.
                  </Text>
                  <TouchableOpacity
                    style={styles.locationToggle}
                    onPress={() => set('showAdvancedCoords', !form.showAdvancedCoords)}
                  >
                    <Ionicons
                      name={form.showAdvancedCoords ? 'chevron-up' : 'settings-outline'}
                      size={13}
                      color={Colors.primary}
                    />
                    <Text style={styles.locationToggleText}>
                      {form.showAdvancedCoords
                        ? 'Fechar coordenadas avançadas'
                        : 'Informar coordenadas avançadas'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Advanced coords — collapsed by default */}
              {form.showAdvancedCoords && (
                <View style={styles.advancedCoords}>
                  <Text style={styles.fieldLabel}>Cidade</Text>
                  <TextInput
                    style={styles.input}
                    value={form.cidade}
                    onChangeText={v => set('cidade', v)}
                    placeholder="Ex: Porto Alegre"
                    placeholderTextColor={Colors.textMuted}
                    maxLength={100}
                  />
                  <View style={styles.row2}>
                    <View style={styles.flex}>
                      <Text style={styles.fieldLabel}>Estado (UF)</Text>
                      <TextInput
                        style={styles.input}
                        value={form.estado}
                        onChangeText={v => set('estado', v.toUpperCase().slice(0, 2))}
                        placeholder="RS"
                        placeholderTextColor={Colors.textMuted}
                        maxLength={2}
                        autoCapitalize="characters"
                      />
                    </View>
                    <View style={styles.row2Gap} />
                    <View style={styles.flex} />
                  </View>
                  <View style={styles.row2}>
                    <View style={styles.flex}>
                      <Text style={styles.fieldLabel}>Latitude</Text>
                      <TextInput
                        style={styles.input}
                        value={form.latitude}
                        onChangeText={v => set('latitude', v)}
                        placeholder="-30.0507"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <View style={styles.row2Gap} />
                    <View style={styles.flex}>
                      <Text style={styles.fieldLabel}>Longitude</Text>
                      <TextInput
                        style={styles.input}
                        value={form.longitude}
                        onChangeText={v => set('longitude', v)}
                        placeholder="-51.1834"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  </View>
                  <Text style={styles.hint}>Latitude: -90 a 90 · Longitude: -180 a 180</Text>
                </View>
              )}

              {/* D. Perfil ambiental */}
              <Text style={styles.sectionLabel}>D. Perfil ambiental</Text>

              <Text style={styles.fieldLabel}>Tipo de área monitorada</Text>
              <View style={styles.chipGrid}>
                {TIPO_AREA_OPTIONS.map(tipo => {
                  const sel = form.tipoArea === tipo;
                  return (
                    <TouchableOpacity
                      key={tipo}
                      style={[styles.chip, sel && styles.chipSelected]}
                      onPress={() => handleTipoAreaChange(tipo)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                        {TipoAreaLabels[tipo]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Nível de vulnerabilidade</Text>
              <View style={styles.vulRow}>
                {VUL_OPTIONS.map((opt, i) => {
                  const sel = form.vulIndex === i;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={[styles.vulBtn, sel && { backgroundColor: opt.bg, borderColor: opt.color }]}
                      onPress={() => set('vulIndex', i)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.vulBtnLabel, sel && { color: opt.color, fontWeight: '700' }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.vulBtnValue, sel && { color: opt.color }]}>
                        {opt.value}/100
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.hint}>Valor técnico enviado: {vul.value}/100</Text>

              <Text style={styles.fieldLabel}>Visibilidade dos dados</Text>
              <View style={styles.chipRow}>
                {VISIBILIDADE_OPTIONS.map(vis => {
                  const sel = form.tipoVisibilidade === vis;
                  return (
                    <TouchableOpacity
                      key={vis}
                      style={[styles.chip, styles.chipFlex, sel && styles.chipSelected]}
                      onPress={() => set('tipoVisibilidade', vis)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                        {VisibilidadeLabels[vis]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* E. Sensores recomendados */}
              <Text style={styles.sectionLabel}>E. Perfil de sensores recomendado</Text>

              {/* Explicit disclaimer — sensors are NOT saved with the region */}
              <View style={styles.sensorDisclaimerBox}>
                <Ionicons name="information-circle-outline" size={15} color="#5A6FD6" style={{ marginTop: 1 }} />
                <Text style={styles.sensorDisclaimerText}>
                  <Text style={{ fontWeight: '700' }}>Planejamento visual — não salvo com a região.</Text>
                  {'\n'}Este perfil orienta a implantação IoT. As estações reais ou simuladas são cadastradas separadamente pela API de Estações.
                </Text>
              </View>

              <Text style={styles.hint}>
                {form.tipoArea
                  ? `Sugestão automática para ${TipoAreaLabels[form.tipoArea]}. Ajuste conforme necessário.`
                  : 'Selecione o tipo de área para sugestão automática de sensores.'}
              </Text>

              <View style={styles.sensorGrid}>
                {ALL_SENSOR_KEYS.map(key => {
                  const s = SENSORS[key];
                  const sel = form.selectedSensors.includes(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.sensorCard, sel && styles.sensorCardSel]}
                      onPress={() => toggleSensor(key)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.sensorCardTop}>
                        <View style={[styles.sensorIconBox, sel && styles.sensorIconBoxSel]}>
                          <Ionicons
                            name={s.icon as 'water-outline'}
                            size={18}
                            color={sel ? Colors.card : Colors.primary}
                          />
                        </View>
                        {sel && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />}
                      </View>
                      <Text style={[styles.sensorLabel, sel && { color: Colors.primary }]}>
                        {s.label}
                      </Text>
                      <Text style={styles.sensorDimension}>{s.dimension}</Text>
                      <Text style={styles.sensorTelemetry}>{s.telemetry}</Text>
                      <Text style={[styles.sensorStatus, { color: s.isReal ? Colors.primary : Colors.textMuted }]}>
                        {s.isReal ? '⚡ Real' : '🔬 Simulado'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.hint}>
                Este perfil orienta a implantação IoT. As estações podem ser cadastradas depois na área de Estações.
              </Text>

              {/* Mobile: preview inline */}
              {!isDesktop && renderPreview()}

              {/* Errors */}
              {(validationError || error) && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color="#D32F2F" />
                  <Text style={styles.errorText}>{validationError ?? error}</Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, (isLoading || clientes.length === 0) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isLoading || clientes.length === 0}
                activeOpacity={0.8}
              >
                {isLoading
                  ? <ActivityIndicator color={Colors.card} />
                  : <Text style={styles.submitBtnText}>{submitLabel}</Text>}
              </TouchableOpacity>

            </View>

            {/* Desktop right column — technical preview */}
            {isDesktop && (
              <View style={styles.previewColumn}>
                {renderPreview()}
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Cliente picker modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar cliente</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {clientesStatus === 'loading' && (
            <View style={styles.modalCenter}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}

          {clientesStatus === 'success' && clientes.length === 0 && (
            <View style={styles.modalCenter}>
              <Text style={styles.modalNote}>Nenhum cliente cadastrado na plataforma.</Text>
            </View>
          )}

          {clientesStatus === 'success' && clientes.length > 0 && (
            <FlatList
              data={clientes}
              keyExtractor={item => String(item.idCliente)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    item.idCliente === form.idCliente && styles.pickerItemSel,
                  ]}
                  onPress={() => { set('idCliente', item.idCliente); setPickerVisible(false); }}
                  activeOpacity={0.75}
                >
                  <View style={styles.pickerItemBody}>
                    <Text style={styles.pickerItemName}>{item.nome}</Text>
                    <Text style={styles.pickerItemType}>{TipoClienteLabels[item.tipoCliente] ?? item.tipoCliente}</Text>
                  </View>
                  {item.idCliente === form.idCliente && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex:   { flex: 1 },
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  contentDesktop: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Desktop 2-column
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  formColumn:    { flex: 1 },
  previewColumn: { width: 290 },

  // Section headings
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  subLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },

  // Inputs
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  row2:    { flexDirection: 'row' },
  row2Gap: { width: Spacing.sm },

  // Cliente picker row
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  pickerLeft:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pickerText:        { flex: 1, fontSize: FontSize.md, color: Colors.text },
  pickerPlaceholder: { flex: 1, fontSize: FontSize.md, color: Colors.textMuted },

  // Preset cards (2×2 grid)
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  presetCard: {
    width: '48%',
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    minHeight: 80,
  },
  presetAccent: { width: 4 },
  presetBody:   { flex: 1, padding: Spacing.sm, gap: 2 },
  presetTopRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  presetVulLabel: { fontSize: FontSize.xs, fontWeight: '700' },
  presetName:   { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  presetSub:    { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 14 },

  // Location card
  locationCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  locationCardTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationCityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationCityText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  locationCoords:   { fontSize: FontSize.sm, color: Colors.textMuted, fontFamily: 'monospace' },
  locationNote:     { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
  locationToggle:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  locationToggleText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },

  locationCardEmpty: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationEmptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Advanced coords section
  advancedCoords: {
    backgroundColor: '#F8F9FF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },

  // Chip selectors
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipFlex: { flex: 1, alignItems: 'center' },
  chipSelected: { borderColor: Colors.primary, backgroundColor: '#EEF0FB' },
  chipText:         { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  chipTextSelected: { color: Colors.primary, fontWeight: '700' },

  // Vulnerability selector
  vulRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  vulBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  vulBtnLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  vulBtnValue: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },

  // Sensor cards (2×2 grid)
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sensorCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 3,
    ...Shadow.sm,
  },
  sensorCardSel: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF0FB',
  },
  sensorCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sensorIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF0FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorIconBoxSel: { backgroundColor: Colors.primary },
  sensorLabel:     { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  sensorDimension: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted },
  sensorTelemetry: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 14 },
  sensorStatus:    { fontSize: FontSize.xs, fontWeight: '600', marginTop: 2 },

  // Technical preview card
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: Spacing.md,
    ...Shadow.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#EEF0FB',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  previewTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  previewSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  previewSectionNote: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
    gap: 4,
  },
  previewSectionTag: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  previewLabel: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },
  previewValue: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.text, flex: 1, textAlign: 'right' },
  previewSensorList:        { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  previewSensorDisclaimer:  { fontSize: FontSize.xs, color: Colors.textMuted },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: { flex: 1, fontSize: FontSize.sm, color: '#D32F2F', lineHeight: 20 },

  // Submit button
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadow.sm,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.card, letterSpacing: 0.3 },

  // Modal
  modalSafe:   { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  modalTitle:  { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  modalCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  modalNote:   { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center' },

  pickerItem:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: Colors.card },
  pickerItemSel:  { backgroundColor: '#EEF0FB' },
  pickerItemBody: { flex: 1, gap: 2 },
  pickerItemName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  pickerItemType: { fontSize: FontSize.sm, color: Colors.textMuted },
  separator:      { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.md },

  // Sensor disclaimer
  sensorDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#EEF0FB',
    borderRadius: Radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sensorDisclaimerText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.text,
    lineHeight: 16,
  },
});
