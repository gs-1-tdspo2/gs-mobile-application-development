import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, Modal, ScrollView,
  StyleSheet, Platform, TouchableWithoutFeedback,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface FilterSelectProps<T extends string> {
  label: string;
  options: SelectOption<T>[];
  selected: T;
  onSelect: (v: T) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function FilterSelect<T extends string>({
  label,
  options,
  selected,
  onSelect,
  disabled = false,
  style,
}: FilterSelectProps<T>) {
  const [open, setOpen] = useState(false);

  const selectedOpt = options.find(o => o.value === selected);
  const isDefault   = options.length > 0 && selected === options[0].value;

  const handleSelect = useCallback((v: T) => {
    onSelect(v);
    setOpen(false);
  }, [onSelect]);

  const handleOpen = useCallback(() => {
    if (!disabled && options.length > 0) setOpen(true);
  }, [disabled, options.length]);

  // ── Web: render a real browser <select> ──────────────────────────────────
  if (Platform.OS === 'web') {
    const borderColor = !isDefault ? Colors.primary : '#D1D5DB';
    const bg          = !isDefault ? '#EEF0FB'      : Colors.card;
    const fg          = !isDefault ? Colors.primary  : Colors.textMuted;
    const fw          = !isDefault ? '600'           : '500';

    return React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minWidth: 0,
          ...(style as object | undefined),
          ...(disabled ? { opacity: 0.45, pointerEvents: 'none' } : {}),
        },
      },
      // Label
      React.createElement(
        'label',
        {
          style: {
            fontSize: 11,
            fontWeight: '600',
            color: Colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          },
        },
        label
      ),
      // Select wrapper
      React.createElement(
        'div',
        { style: { position: 'relative', display: 'flex', alignItems: 'stretch' } },
        React.createElement(
          'select',
          {
            value: selected,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onSelect(e.target.value as T),
            disabled,
            style: {
              width: '100%',
              padding: '6px 28px 6px 10px',
              borderRadius: 6,
              border: `1.5px solid ${borderColor}`,
              backgroundColor: bg,
              color: fg,
              fontSize: 13,
              fontWeight: fw,
              cursor: disabled ? 'not-allowed' : 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'border-color 0.15s',
            },
          },
          ...options.map(opt =>
            React.createElement('option', { key: opt.value, value: opt.value }, opt.label)
          )
        ),
        // Chevron icon (non-interactive)
        React.createElement(
          'span',
          {
            style: {
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: fg,
              fontSize: 11,
              lineHeight: '1',
              userSelect: 'none',
            },
          },
          '▾'
        )
      )
    ) as unknown as React.ReactElement;
  }

  // ── Mobile: Modal bottom-sheet ────────────────────────────────────────────
  return (
    <>
      <View style={[s.wrap, disabled && s.wrapDisabled, style]}>
        <Text style={s.label} numberOfLines={1}>{label}</Text>
        <Pressable
          style={[s.trigger, !isDefault && s.triggerActive, disabled && s.triggerDisabled]}
          onPress={handleOpen}
          disabled={disabled}
        >
          <Text
            style={[s.triggerText, !isDefault && s.triggerTextActive]}
            numberOfLines={1}
          >
            {selectedOpt?.label ?? (options[0]?.label ?? '–')}
          </Text>
          <Ionicons
            name="chevron-down"
            size={12}
            color={!isDefault ? Colors.primary : Colors.textMuted}
          />
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={m.overlayNative}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={m.sheetNative}>
                {/* Header */}
                <View style={m.hdr}>
                  <Text style={m.hdrLabel}>{label}</Text>
                  <Pressable onPress={() => setOpen(false)} hitSlop={8} style={m.closeBtn}>
                    <Ionicons name="close" size={18} color={Colors.textMuted} />
                  </Pressable>
                </View>
                {/* Options */}
                <ScrollView
                  bounces={false}
                  style={m.scroll}
                  showsVerticalScrollIndicator={false}
                >
                  {options.map(opt => {
                    const sel = opt.value === selected;
                    return (
                      <Pressable
                        key={opt.value}
                        style={[m.option, sel && m.optSel]}
                        onPress={() => handleSelect(opt.value)}
                      >
                        <Text style={[m.optTxt, sel && m.optTxtSel]} numberOfLines={2}>
                          {opt.label}
                        </Text>
                        {sel && <Ionicons name="checkmark" size={15} color={Colors.primary} />}
                      </Pressable>
                    );
                  })}
                  <View style={{ height: Spacing.sm }} />
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 4, minWidth: 0 },
  wrapDisabled: { opacity: 0.45 },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  triggerActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF0FB',
  },
  triggerDisabled: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  triggerText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  triggerTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

const m = StyleSheet.create({
  overlayNative: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheetNative: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    maxHeight: 400,
    overflow: 'hidden',
  },
  hdr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hdrLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  closeBtn: { padding: 2, marginLeft: Spacing.sm },
  scroll: { maxHeight: 300 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optSel: { backgroundColor: '#EEF0FB' },
  optTxt: {
    fontSize: FontSize.sm,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.xs,
  },
  optTxtSel: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
