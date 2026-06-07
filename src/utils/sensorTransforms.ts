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
    if (!r.dtLeit) continue; // skip records with missing timestamp
    const v = readField(r as unknown as Record<string, unknown>, candidates);
    if (v !== null) {
      available = true;
      points.push({ label: formatLeituraTimestamp(r.dtLeit), value: v });
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
  if (leituras.length === 0) {
    const empty = (label: string, unit: string): SensorSeries => ({
      unit, label, available: false, points: [],
      latestValue: null, latestLabel: null, min: null, max: null,
    });
    return {
      totalLeituras: 0,
      rangeLabel: null,
      agua: { distancia: empty('Distância à água', 'cm'), nivel: empty('Nível de água', '%') },
      particulado: { pm25: empty('PM2.5', 'µg/m³'), pm10: empty('PM10', 'µg/m³') },
      pressao: empty('Pressão atmosférica', 'hPa'),
      movimento: { inclinacao: empty('Inclinação', '°'), vibracao: empty('Vibração', 'índice') },
    };
  }

  // Sort ascending by reading timestamp; records with no/invalid timestamp sort to front
  const sorted = [...leituras].sort((a, b) => {
    const ta = new Date(normalizeTimestamp(a.dtLeit)).getTime();
    const tb = new Date(normalizeTimestamp(b.dtLeit)).getTime();
    return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
  });

  const first = sorted[0].dtLeit;
  const last = sorted[sorted.length - 1].dtLeit;
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
    totalLeituras: sorted.length,
    rangeLabel,
    agua: {
      distancia: buildSeries(sorted,
        ['distanciaAguaCm', 'nrDistanciaAguaCm', 'waterDistanceCm', 'distanciaAgua'],
        'Distância à água', 'cm'),
      nivel: buildSeries(sorted,
        ['nivelAguaPct', 'nrNivelAguaPct', 'waterLevelPercent', 'nivelAgua', 'nivelAguaPercentual'],
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
