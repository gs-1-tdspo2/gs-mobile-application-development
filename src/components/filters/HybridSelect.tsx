import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';

export interface HybridOption {
  value: string;
  label: string;
}

interface HybridSelectProps {
  label: string;
  placeholder?: string;
  options: HybridOption[];
  value: string;
  onChange: (text: string) => void;
  /** Called when the user explicitly selects a known option (by tapping or exact datalist match). */
  onOptionSelect?: (value: string, label: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

let _idCounter = 0;

export function HybridSelect({
  label,
  placeholder = 'Selecionar ou digitar…',
  options,
  value,
  onChange,
  onOptionSelect,
  disabled = false,
  style,
}: HybridSelectProps) {
  // stable id for web datalist
  const [listId] = useState(() => `hs-${++_idCounter}`);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const matchingOptions = useMemo(() => {
    if (!value.trim()) return [];
    const q = value.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q)).slice(0, 6);
  }, [value, options]);

  const handleChange = useCallback((t: string) => {
    onChange(t);
    setShowSuggestions(t.trim().length > 0);
  }, [onChange]);

  const handleOptionTap = useCallback((opt: HybridOption) => {
    onChange(opt.label);
    onOptionSelect?.(opt.value, opt.label);
    setShowSuggestions(false);
  }, [onChange, onOptionSelect]);

  const handleClear = useCallback(() => {
    onChange('');
    onOptionSelect?.('', '');
    setShowSuggestions(false);
  }, [onChange, onOptionSelect]);

  // ── Web: <input list="datalist"> ─────────────────────────────────────────
  if (Platform.OS === 'web') {
    const active = value.trim().length > 0;
    const borderColor = active ? Colors.primary : '#D1D5DB';
    const bg          = active ? '#EEF0FB'      : Colors.card;
    const fg          = active ? Colors.primary  : Colors.textMuted;

    const handleWebChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const t = e.target.value;
      onChange(t);
      const exact = options.find(o => o.label === t);
      if (exact) onOptionSelect?.(exact.value, exact.label);
    };

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
      React.createElement('label', {
        style: {
          fontSize: 11, fontWeight: '600', color: Colors.textMuted,
          textTransform: 'uppercase', letterSpacing: '0.4px',
          display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', userSelect: 'none',
        },
      }, label),
      React.createElement('div', { style: { position: 'relative' } },
        React.createElement('input', {
          type: 'text',
          list: listId,
          value,
          onChange: handleWebChange,
          placeholder,
          disabled,
          style: {
            width: '100%',
            padding: '6px ' + (active ? '28px' : '10px') + ' 6px 10px',
            borderRadius: 6,
            border: `1.5px solid ${borderColor}`,
            backgroundColor: bg,
            color: fg,
            fontSize: 13,
            fontWeight: active ? '600' : '500',
            cursor: disabled ? 'not-allowed' : 'text',
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          },
        }),
        active
          ? React.createElement('button', {
              type: 'button',
              onClick: () => { onChange(''); onOptionSelect?.('', ''); },
              style: {
                position: 'absolute', right: 6, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: Colors.textMuted, fontSize: 14, padding: '2px 4px',
                lineHeight: 1,
              },
            }, '×')
          : null
      ),
      React.createElement('datalist', { id: listId },
        ...options.map(opt =>
          React.createElement('option', { key: opt.value, value: opt.label })
        )
      )
    ) as unknown as React.ReactElement;
  }

  // ── Mobile: TextInput + inline suggestion list ────────────────────────────
  const hasValue = value.trim().length > 0;

  return (
    <View style={[s.wrap, disabled && s.wrapDisabled, style]}>
      <Text style={s.label} numberOfLines={1}>{label}</Text>

      <View style={[s.inputRow, hasValue && s.inputRowActive]}>
        <Ionicons
          name="search-outline"
          size={13}
          color={hasValue ? Colors.primary : Colors.textMuted}
        />
        <TextInput
          style={s.input}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          editable={!disabled}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {hasValue && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && matchingOptions.length > 0 && (
        <View style={s.suggestions}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            style={s.suggestionsScroll}
          >
            {matchingOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={s.suggestionItem}
                onPress={() => handleOptionTap(opt)}
                activeOpacity={0.75}
              >
                <Text style={s.suggestionText} numberOfLines={1}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 2, minWidth: 0 },
  wrapDisabled: { opacity: 0.45 },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    ...Shadow.sm,
  },
  inputRowActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF0FB',
  },
  input: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    paddingVertical: 0,
  },
  suggestions: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginTop: 2,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  suggestionsScroll: { maxHeight: 160 },
  suggestionItem: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
});
