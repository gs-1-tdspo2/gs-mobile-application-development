/**
 * SvgLineChart — cross-platform line + area chart built on react-native-svg.
 * Gradient area fill · connected dots · Y-axis grid · X-axis timestamps.
 * Hover tooltip on web (onMouseMove) · tap tooltip on native (SVG Rect press).
 * Works on iOS, Android, and Expo Web without Skia.
 */
import { useId, useState } from 'react';
import { View, Platform } from 'react-native';
import Svg, {
  Path,
  Circle,
  G,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  Line as SvgLine,
  Text as SvgText,
} from 'react-native-svg';
import type { SensorPoint } from '@utils/sensorTransforms';
import { Colors } from '@constants/colors';

const PAD = { l: 44, r: 10, t: 6, b: 22 } as const;
const TIP_W = 98;
const TIP_H = 42;
const TIP_GAP = 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function niceGridVals(dMin: number, dMax: number, steps = 4): number[] {
  if (dMin === dMax) { dMin -= 1; dMax += 1; }
  const range = dMax - dMin;
  const rawStep = range / steps;
  const exp = Math.floor(Math.log10(rawStep || 1));
  const base = Math.pow(10, exp);
  const step = ([1, 2, 5, 10].find(m => m * base >= rawStep) ?? 10) * base;
  const lo = Math.floor(dMin / step) * step;
  const hi = Math.ceil(dMax / step) * step;
  const out: number[] = [];
  let v = lo;
  while (v <= hi + step * 0.001 && out.length < 8) {
    out.push(parseFloat(v.toFixed(10)));
    v = parseFloat((v + step).toFixed(10));
  }
  return out;
}

function yLabel(v: number, unit: string): string {
  if (unit === '°') return v.toFixed(1);
  if (unit === 'índice') return v.toFixed(2);
  return Math.round(v).toString();
}

function fmtValue(v: number, unit: string): string {
  if (unit === '°') return `${v.toFixed(2)}°`;
  if (unit === 'índice') return v.toFixed(3);
  if (unit === 'hPa') return `${v.toFixed(1)} hPa`;
  if (unit === '%') return `${v.toFixed(1)}%`;
  if (unit === 'cm') return `${v.toFixed(1)} cm`;
  if (unit === 'µg/m³') return `${v.toFixed(0)} µg/m³`;
  return `${v} ${unit}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  points: SensorPoint[];
  color: string;
  unit: string;
  height?: number;
}

export function SvgLineChart({ points, color, unit, height = 152 }: Props) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const [w, setW] = useState(0);
  const [tipIdx, setTipIdx] = useState<number | null>(null);

  if (points.length < 2) return null;

  const plotW = Math.max(w - PAD.l - PAD.r, 1);
  const plotH = height - PAD.t - PAD.b;

  const vals = points.map(p => p.value);
  const dMin = Math.min(...vals);
  const dMax = Math.max(...vals);
  const grid = niceGridVals(dMin, dMax);
  const yMin = grid[0];
  const yMax = grid[grid.length - 1];
  const yRange = yMax - yMin || 1;

  const px = (i: number) => PAD.l + (i / (points.length - 1)) * plotW;
  const py = (v: number) => PAD.t + plotH - ((v - yMin) / yRange) * plotH;

  const ptStrs = points.map((p, i) => `${px(i).toFixed(1)},${py(p.value).toFixed(1)}`);
  const linePath = `M ${ptStrs.join(' L ')}`;
  const axisY = PAD.t + plotH;
  const areaPath =
    `${linePath} L ${px(points.length - 1).toFixed(1)},${axisY.toFixed(1)}` +
    ` L ${PAD.l},${axisY.toFixed(1)} Z`;

  const xStep = Math.max(1, Math.ceil(points.length / 7));
  const xIdxs: number[] = [];
  for (let i = 0; i < points.length; i += xStep) xIdxs.push(i);
  if (xIdxs[xIdxs.length - 1] !== points.length - 1) xIdxs.push(points.length - 1);

  // If labels are "DD/MM HH:mm", show date once in the corner and only time on ticks
  const hasDatePrefix = points[0].label.includes(' ');
  const cornerDate = hasDatePrefix ? points[0].label.split(' ')[0] : null;
  const tickLabel = (label: string) => hasDatePrefix ? (label.split(' ')[1] ?? label) : label;

  const gradId = `glg${uid}`;

  // Nearest point by SVG x coordinate
  const nearestIdx = (svgX: number): number => {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(px(i) - svgX);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  };

  // Tooltip box position — keep within SVG bounds
  let tipBoxX = 0;
  let tipBoxY = 0;
  if (tipIdx !== null) {
    const cx = px(tipIdx);
    const cy = py(points[tipIdx].value);
    tipBoxX = cx + TIP_W + TIP_GAP > w ? cx - TIP_W - TIP_GAP : cx + TIP_GAP;
    tipBoxY = cy - TIP_H - TIP_GAP < PAD.t ? cy + TIP_GAP : cy - TIP_H - TIP_GAP;
  }

  // Web: continuous hover via onMouseMove on the wrapping View
  const webEvents =
    Platform.OS === 'web'
      ? {
          onMouseMove: (e: MouseEvent & { currentTarget: HTMLElement }) => {
            if (w === 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setTipIdx(nearestIdx(e.clientX - rect.left));
          },
          onMouseLeave: () => setTipIdx(null),
        }
      : {};

  return (
    <View
      onLayout={ev => setW(ev.nativeEvent.layout.width)}
      style={{ height, marginTop: 8 }}
      {...(webEvents as object)}
    >
      {w > 0 && (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity={0.38} />
              <Stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {/* Horizontal grid lines + Y labels */}
          {grid.map(v => (
            <G key={v}>
              <SvgLine
                x1={PAD.l} y1={py(v)} x2={PAD.l + plotW} y2={py(v)}
                stroke={Colors.text} strokeOpacity={0.07} strokeWidth={1}
              />
              <SvgText
                x={PAD.l - 5} y={py(v) + 4}
                textAnchor="end" fontSize={9} fill={Colors.textMuted}
              >
                {yLabel(v, unit)}
              </SvgText>
            </G>
          ))}

          {/* X-axis baseline */}
          <SvgLine
            x1={PAD.l} y1={axisY} x2={PAD.l + plotW} y2={axisY}
            stroke={Colors.text} strokeOpacity={0.15} strokeWidth={1}
          />

          {/* Area fill */}
          <Path d={areaPath} fill={`url(#${gradId})`} />

          {/* Line */}
          <Path
            d={linePath}
            stroke={color}
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots */}
          {points.map((p, i) => (
            <Circle key={i} cx={px(i)} cy={py(p.value)} r={2.8} fill={color} />
          ))}

          {/* X-axis labels — date once at far left, time-only on ticks */}
          {cornerDate && (
            <SvgText
              x={PAD.l} y={height - 4}
              textAnchor="start" fontSize={9} fill={Colors.textMuted}
            >
              {cornerDate}
            </SvgText>
          )}
          {xIdxs
            .filter(i => !(cornerDate && i === 0))
            .map(i => (
              <SvgText
                key={i}
                x={px(i)} y={height - 4}
                textAnchor="middle" fontSize={9} fill={Colors.textMuted}
              >
                {tickLabel(points[i].label)}
              </SvgText>
            ))}

          {/* Native: full-area tap overlay (doesn't exist on web — handled by onMouseMove) */}
          {Platform.OS !== 'web' && (
            <Rect
              x={0} y={0} width={w} height={height}
              fill="transparent"
              onPress={e => {
                const x = e.nativeEvent.locationX;
                const idx = nearestIdx(x);
                setTipIdx(prev => prev === idx ? null : idx);
              }}
            />
          )}

          {/* Tooltip overlay */}
          {tipIdx !== null && (
            <G>
              {/* Vertical crosshair */}
              <SvgLine
                x1={px(tipIdx)} y1={PAD.t}
                x2={px(tipIdx)} y2={axisY}
                stroke={color} strokeOpacity={0.5} strokeWidth={1}
                strokeDasharray="3,2"
              />

              {/* Highlighted dot — larger */}
              <Circle
                cx={px(tipIdx)} cy={py(points[tipIdx].value)}
                r={5} fill={color}
              />

              {/* Box */}
              <Rect
                x={tipBoxX} y={tipBoxY}
                width={TIP_W} height={TIP_H}
                rx={5} ry={5}
                fill="#0A1628"
                stroke={color} strokeWidth={1}
                fillOpacity={0.95}
              />

              {/* Timestamp */}
              <SvgText
                x={tipBoxX + TIP_W / 2} y={tipBoxY + 15}
                textAnchor="middle" fontSize={10} fontWeight="700" fill="#FFFFFF"
              >
                {points[tipIdx].label}
              </SvgText>

              {/* Value */}
              <SvgText
                x={tipBoxX + TIP_W / 2} y={tipBoxY + 31}
                textAnchor="middle" fontSize={11} fontWeight="600" fill={color}
              >
                {fmtValue(points[tipIdx].value, unit)}
              </SvgText>
            </G>
          )}
        </Svg>
      )}
    </View>
  );
}
