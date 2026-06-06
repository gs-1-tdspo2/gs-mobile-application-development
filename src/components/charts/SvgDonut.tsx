/**
 * SvgDonut — cross-platform SVG donut chart using react-native-svg.
 * Works on iOS, Android, and Expo Web without Skia.
 */
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Text as SvgText, Circle } from 'react-native-svg';
import type { PieSlice } from '@utils/chartTransforms';
import { Colors } from '@constants/colors';
import { FontSize } from '@constants/design';

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildSlicePath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number,
): string {
  // Clamp to prevent degenerate 360° arcs
  const safeEnd = Math.min(endDeg, startDeg + 359.9);
  const largeArc = safeEnd - startDeg > 180 ? 1 : 0;
  const os = polarToXY(cx, cy, outerR, startDeg);
  const oe = polarToXY(cx, cy, outerR, safeEnd);
  const ie = polarToXY(cx, cy, innerR, safeEnd);
  const is_ = polarToXY(cx, cy, innerR, startDeg);
  const f = (n: number) => n.toFixed(3);
  return [
    `M ${f(os.x)} ${f(os.y)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${f(oe.x)} ${f(oe.y)}`,
    `L ${f(ie.x)} ${f(ie.y)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${f(is_.x)} ${f(is_.y)}`,
    'Z',
  ].join(' ');
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface SvgDonutProps {
  data: PieSlice[];
  total: number;
  centerCaption: string;
  size?: number;
}

export function SvgDonut({ data, total, centerCaption, size = 200 }: SvgDonutProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 6;
  const innerR = outerR * 0.58;

  const active = data.filter(s => s.value > 0 && total > 0);

  let cursor = 0;
  const segments = active.map(s => {
    const sweep = (s.value / total) * 360;
    const seg = {
      key: s.key,
      color: s.color,
      d: buildSlicePath(cx, cy, outerR, innerR, cursor, cursor + sweep),
    };
    cursor += sweep;
    return seg;
  });

  // Text sizing
  const numFontSize = size <= 160 ? FontSize.xl : FontSize.xxl;
  const capFontSize = FontSize.xs;
  // Center label y-coordinates (SVG text y = baseline)
  const totalBlockH = numFontSize + 4 + capFontSize;
  const numY = cy - totalBlockH / 2 + numFontSize;
  const capY = numY + 4 + capFontSize;

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size}>
        {/* Empty ring when no data */}
        {segments.length === 0 && (
          <Circle
            cx={cx}
            cy={cy}
            r={(outerR + innerR) / 2}
            stroke={Colors.border}
            strokeWidth={outerR - innerR}
            fill="none"
          />
        )}

        {/* Slices */}
        {segments.map(seg => (
          <Path key={seg.key} d={seg.d} fill={seg.color} />
        ))}

        {/* Center label */}
        <SvgText
          x={cx}
          y={numY}
          textAnchor="middle"
          fontSize={numFontSize}
          fontWeight="700"
          fill={Colors.text}
        >
          {String(total)}
        </SvgText>
        <SvgText
          x={cx}
          y={capY}
          textAnchor="middle"
          fontSize={capFontSize}
          fill={Colors.textMuted}
        >
          {centerCaption}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
  },
});
