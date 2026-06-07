import type { LeituraIot } from '@/types';

// ─── Data shapes ──────────────────────────────────────────────────────────────

export interface SensorPoint {
  label: string;  // formatted timestamp for display
  value: number;
}

export interface SensorSeries {
  unit: string;
  label: string;       // human-readable field name
  available: boolean;  // true if field appeared in at least one reading
  points: SensorPoint[];
  latestValue: number | null;
  latestLabel: string | null;
  min: number | null;
  max: number | null;
}

export interface SensorAnalysis {
  totalLeituras: number;
  rangeLabel: string | null;
  agua: {
    distancia: SensorSeries;
    nivel: SensorSeries;
  };
  particulado: {
    pm25: SensorSeries;
    pm10: SensorSeries;
  };
  pressao: SensorSeries;
  movimento: {
    inclinacao: SensorSeries;
    vibracao: SensorSeries;
  };
}

// ─── Normalisation helpers ────────────────────────────────────────────────────

// Java serialisation can vary. Try multiple known field-name candidates.
function readField(
  raw: Record<string, unknown>,
  candidates: string[],
): number | null {
  for (const key of candidates) {
    const v = raw[key];
    if (v !== undefined && v !== null && typeof v === 'number') return v;
    if (v !== undefined && v !== null && typeof v === 'string') {
      const n = parseFloat(v);
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

function normalizeTimestamp(raw: string | null | undefined): string {
  if (!raw) return '';
  // Truncate nanoseconds (Java: "2026-01-01T12:00:00.123456789") → ISO-safe
  const truncated = raw.replace(/(\.\d{3})\d+/, '$1');
  if (!truncated.endsWith('Z') && !truncated.includes('+')) {
    return truncated + 'Z';
  }
  return truncated;
}

export function formatLeituraTimestamp(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    const d = new Date(normalizeTimestamp(raw));
    if (isNaN(d.getTime())) return raw.slice(11, 16); // fallback: HH:mm substring
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');
    const mon = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${day}/${mon} ${h}:${m}`;
  } catch {
    return raw.slice(0, 16);
  }
}

// ─── Series builder ───────────────────────────────────────────────────────────

function buildSeries(
  sorted: LeituraIot[],
  candidates: string[],
  label: string,
  unit: string,
  limit = 30,
): SensorSeries {
  const points: SensorPoint[] = [];
  let available = false;

  for (const r of sorted) {
    if (!r.dtLeitura) continue;
    const v = readField(r as unknown as Record<string, unknown>, candidates);
    if (v !== null) {
      available = true;
      points.push({ label: formatLeituraTimestamp(r.dtLeitura), value: v });
    }
  }

  const trimmed = points.slice(-limit);
  const values = trimmed.map(p => p.value);
  const min = values.length > 0 ? Math.min(...values) : null;
  const max = values.length > 0 ? Math.max(...values) : null;
  const latest = trimmed.length > 0 ? trimmed[trimmed.length - 1] : null;

  return {
    unit,
    label,
    available,
    points: trimmed,
    latestValue: latest?.value ?? null,
    latestLabel: latest?.label ?? null,
    min,
    max,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function extractSensorAnalysis(leituras: LeituraIot[]): SensorAnalysis {
  const empty = (label: string, unit: string): SensorSeries => ({
    unit, label, available: false, points: [],
    latestValue: null, latestLabel: null, min: null, max: null,
  });
  const emptyResult = (): SensorAnalysis => ({
    totalLeituras: 0,
    rangeLabel: null,
    agua: { distancia: empty('Distância à água', 'cm'), nivel: empty('Nível de água', '%') },
    particulado: { pm25: empty('PM2.5', 'µg/m³'), pm10: empty('PM10', 'µg/m³') },
    pressao: empty('Pressão atmosférica', 'hPa'),
    movimento: { inclinacao: empty('Inclinação', '°'), vibracao: empty('Vibração', 'índice') },
  });

  if (leituras.length === 0) return emptyResult();

  // Exclude backend-invalidated readings (stValida === 'N'); accept 'S', undefined, null, Wokwi booleans
  const valid = leituras.filter(r => r.stValida !== 'N');
  if (valid.length === 0) return emptyResult();

  // Sort ascending (oldest → newest) using dtRecebidoEm as primary key — more reliable than device-generated dtLeitura
  const sorted = [...valid].sort((a, b) => {
    const ta = new Date(normalizeTimestamp(a.dtRecebidoEm ?? a.dtLeitura)).getTime();
    const tb = new Date(normalizeTimestamp(b.dtRecebidoEm ?? b.dtLeitura)).getTime();
    return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
  });

  const first = sorted[0].dtLeitura;
  const last = sorted[sorted.length - 1].dtLeitura;
  let rangeLabel: string | null = null;
  try {
    const fd = new Date(normalizeTimestamp(first));
    const ld = new Date(normalizeTimestamp(last));
    if (!isNaN(fd.getTime()) && !isNaN(ld.getTime())) {
      rangeLabel = `${formatLeituraTimestamp(first)} – ${formatLeituraTimestamp(last)}`;
    }
  } catch {
    rangeLabel = null;
  }

  return {
    totalLeituras: valid.length,
    rangeLabel,
    agua: {
      distancia: buildSeries(sorted,
        ['distanciaAguaCm', 'nrDistanciaAguaCm', 'waterDistanceCm', 'distanciaAgua'],
        'Distância à água', 'cm'),
      nivel: buildSeries(sorted,
        ['nivelAguaPercentual', 'nivelAguaPct', 'nrNivelAguaPct', 'waterLevelPercent', 'nivelAgua'],
        'Nível de água', '%'),
    },
    particulado: {
      pm25: buildSeries(sorted, ['pm25', 'nrPm25', 'PM25'], 'PM2.5', 'µg/m³'),
      pm10: buildSeries(sorted, ['pm10', 'nrPm10', 'PM10'], 'PM10', 'µg/m³'),
    },
    pressao: buildSeries(sorted,
      ['pressaoHpa', 'nrPressaoHpa', 'pressureHpa', 'pressaoAtmosferica'],
      'Pressão atmosférica', 'hPa'),
    movimento: {
      inclinacao: buildSeries(sorted,
        ['inclinacaoGraus', 'nrInclGraus', 'tiltAngle', 'inclinacao'],
        'Inclinação', '°'),
      vibracao: buildSeries(sorted,
        ['vibracao', 'nrVibracao', 'vibration'],
        'Vibração', 'índice'),
    },
  };
}

// ─── Sparkline helper ─────────────────────────────────────────────────────────

/** Returns last N points, scaled 0-1 relative to series max, for sparkline rendering. */
export function scaledSparklinePoints(series: SensorSeries, n = 20): number[] {
  const pts = series.points.slice(-n);
  if (pts.length === 0) return [];
  const max = series.max ?? 1;
  const min = series.min ?? 0;
  const range = max - min || 1;
  return pts.map(p => (p.value - min) / range);
}

/** Format a sensor value with its unit for display. */
export function formatSensorValue(value: number | null, unit: string): string {
  if (value === null) return '—';
  if (unit === 'hPa') return `${value.toFixed(1)} hPa`;
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === 'cm') return `${value.toFixed(1)} cm`;
  if (unit === 'µg/m³') return `${value.toFixed(0)} µg/m³`;
  if (unit === '°') return `${value.toFixed(1)}°`;
  if (unit === 'índice') return value.toFixed(3);
  return `${value} ${unit}`;
}

// ─── Sensor history ───────────────────────────────────────────────────────────

export type HistoryPeriod = 'today' | '24h' | '7d' | 'all';

export interface HistoryStats {
  latest: number | null;
  avg: number | null;
  min: number | null;
  max: number | null;
  count: number;
}

export interface HistorySeries {
  label: string;
  unit: string;
  period: HistoryPeriod;
  points: SensorPoint[];
  aggregated: boolean;
  stats: HistoryStats;
}

const FIELD_CANDIDATES_MAP: Record<string, string[]> = {
  nivelAguaPercentual: ['nivelAguaPercentual', 'nivelAguaPct', 'nrNivelAguaPct', 'waterLevelPercent', 'nivelAgua'],
  distanciaAguaCm:     ['distanciaAguaCm', 'nrDistanciaAguaCm', 'waterDistanceCm', 'distanciaAgua'],
  pressaoHpa:          ['pressaoHpa', 'nrPressaoHpa', 'pressureHpa', 'pressaoAtmosferica'],
  pm25:                ['pm25', 'nrPm25', 'PM25'],
  pm10:                ['pm10', 'nrPm10', 'PM10'],
  inclinacaoGraus:     ['inclinacaoGraus', 'nrInclGraus', 'tiltAngle', 'inclinacao'],
  vibracao:            ['vibracao', 'nrVibracao', 'vibration'],
};

function filterByPeriod(sorted: LeituraIot[], period: HistoryPeriod): LeituraIot[] {
  if (period === 'all') return sorted;
  const now = Date.now();
  let cutoff: number;
  if (period === 'today') {
    const d = new Date(now);
    cutoff = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  } else if (period === '24h') {
    cutoff = now - 24 * 60 * 60 * 1000;
  } else {
    cutoff = now - 7 * 24 * 60 * 60 * 1000;
  }
  return sorted.filter(r => {
    const ts = r.dtRecebidoEm ?? r.dtLeitura;
    if (!ts) return false;
    const t = new Date(normalizeTimestamp(ts)).getTime();
    return !isNaN(t) && t >= cutoff;
  });
}

function aggregateByDay(readings: LeituraIot[], candidates: string[]): SensorPoint[] {
  const byDay = new Map<string, { vals: number[]; lastMs: number }>();
  for (const r of readings) {
    const ts = r.dtRecebidoEm ?? r.dtLeitura;
    if (!ts) continue;
    const d = new Date(normalizeTimestamp(ts));
    if (isNaN(d.getTime())) continue;
    const day = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const v = readField(r as unknown as Record<string, unknown>, candidates);
    if (v !== null) {
      const entry = byDay.get(day);
      const ms = d.getTime();
      if (entry) {
        entry.vals.push(v);
        if (ms > entry.lastMs) entry.lastMs = ms;
      } else {
        byDay.set(day, { vals: [v], lastMs: ms });
      }
    }
  }
  return Array.from(byDay.entries())
    .sort((a, b) => a[1].lastMs - b[1].lastMs)
    .map(([label, { vals }]) => ({
      label,
      value: vals.reduce((s, v) => s + v, 0) / vals.length,
    }));
}

export function buildHistorySeries(
  leituras: LeituraIot[],
  field: string,
  label: string,
  unit: string,
  period: HistoryPeriod,
): HistorySeries {
  const candidates = FIELD_CANDIDATES_MAP[field] ?? [field];
  const valid = leituras.filter(r => r.stValida !== 'N');
  const sorted = [...valid].sort((a, b) => {
    const ta = new Date(normalizeTimestamp(a.dtRecebidoEm ?? a.dtLeitura)).getTime();
    const tb = new Date(normalizeTimestamp(b.dtRecebidoEm ?? b.dtLeitura)).getTime();
    return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
  });
  const filtered = filterByPeriod(sorted, period);
  const shouldAggregate = (period === '7d' || period === 'all') && filtered.length > 48;

  let points: SensorPoint[];
  if (shouldAggregate) {
    points = aggregateByDay(filtered, candidates);
  } else {
    const raw: SensorPoint[] = [];
    for (const r of filtered) {
      const ts = r.dtRecebidoEm ?? r.dtLeitura;
      if (!ts) continue;
      const v = readField(r as unknown as Record<string, unknown>, candidates);
      if (v !== null) raw.push({ label: formatLeituraTimestamp(ts), value: v });
    }
    if (raw.length > 60) {
      const step = Math.ceil(raw.length / 60);
      points = raw.filter((_, i) => i % step === 0 || i === raw.length - 1);
    } else {
      points = raw;
    }
  }

  const allValues: number[] = [];
  for (const r of filtered) {
    const v = readField(r as unknown as Record<string, unknown>, candidates);
    if (v !== null) allValues.push(v);
  }
  const n = allValues.length;
  const stats: HistoryStats = {
    latest: n > 0 ? allValues[n - 1] : null,
    avg:    n > 0 ? allValues.reduce((s, v) => s + v, 0) / n : null,
    min:    n > 0 ? Math.min(...allValues) : null,
    max:    n > 0 ? Math.max(...allValues) : null,
    count:  n,
  };

  return { label, unit, period, points, aggregated: shouldAggregate, stats };
}
