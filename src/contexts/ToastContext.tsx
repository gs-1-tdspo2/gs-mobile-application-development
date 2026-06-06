import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius } from '@constants/design';

export type ToastType = 'success' | 'error';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
});

export function useToast() {
  return useContext(ToastContext);
}

// ─── Single Toast banner ──────────────────────────────────────────────────────

function ToastBanner({ toast, onHide }: { toast: ToastMessage; onHide: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  // Animate in, hold, then animate out
  Animated.sequence([
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
    Animated.delay(2800),
    Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: Platform.OS !== 'web' }),
  ]).start(() => onHide());

  const isSuccess = toast.type === 'success';
  const bgColor   = isSuccess ? '#1B5E20' : '#B71C1C';
  const icon      = isSuccess ? 'checkmark-circle' : 'alert-circle';

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bgColor, opacity }]}>
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={styles.bannerText} numberOfLines={2}>{toast.message}</Text>
    </Animated.View>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

let _nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = _nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const hide = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={styles.root}>
        {children}

        {/* Toast stack — absolute over all content; pointerEvents in style prevents blocking user interaction */}
        <View style={styles.stack}>
          {toasts.map(t => (
            <ToastBanner key={t.id} toast={t} onHide={() => hide(t.id)} />
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  stack: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 72,
    left: Spacing.md,
    right: Spacing.md,
    gap: Spacing.sm,
    zIndex: 9999,
    pointerEvents: 'none' as const,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    // Platform-aware shadow: boxShadow on web, native shadow props on iOS/Android
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 2px 8px rgba(0,0,0,0.28)' } as object)
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 8 }),
    maxWidth: 500,
    alignSelf: 'center' as const,
    width: '100%',
  },
  bannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 18,
  },
});
