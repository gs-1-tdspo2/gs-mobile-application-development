import { Href, Link } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useResponsiveLayout } from '@/utils/responsive';

export type AppRoute = 'dashboard' | 'regioes' | 'gerenciar' | 'alertas' | 'indicadores';

type AppShellProps = PropsWithChildren<{
  activeRoute: AppRoute;
}>;

type NavItem = { key: AppRoute; label: string; href: Href; symbol: string };

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',   label: 'Dashboard',          href: '/',                  symbol: '⊞' },
  { key: 'regioes',     label: 'Regiões',             href: '/regioes',           symbol: '◎' },
  { key: 'gerenciar',   label: 'Gerenciar Regiões',   href: '/gerenciar-regioes', symbol: '⊕' },
  { key: 'alertas',     label: 'Alertas',             href: '/alertas',           symbol: '△' },
  { key: 'indicadores', label: 'Indicadores',         href: '/indicadores',       symbol: '≡' },
];

const PAGE_TITLE: Record<AppRoute, string> = {
  dashboard:   'Dashboard',
  regioes:     'Regiões',
  gerenciar:   'Gerenciar Regiões',
  alertas:     'Alertas',
  indicadores: 'Indicadores',
};

export function AppShell({ activeRoute, children }: AppShellProps) {
  const { isDesktop } = useResponsiveLayout();

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <View style={styles.shell}>

      {/* ── Sidebar ─────────────────────────────────── */}
      <View style={styles.sidebar}>

        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>A</Text>
          </View>
          <View style={styles.brandText}>
            <Text style={styles.brandName}>Amanajé</Text>
            <Text style={styles.brandSub}>Environmental Intelligence</Text>
          </View>
        </View>

        {/* Nav */}
        <ScrollView
          style={styles.navScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.navContent}>
          {NAV_ITEMS.map((item) => {
            const active = item.key === activeRoute;
            return (
              <Link key={item.key} href={item.href} asChild>
                <Pressable
                  accessibilityRole="link"
                  style={({ hovered, pressed }) => [
                    styles.navItem,
                    active   && styles.navItemActive,
                    hovered && !active && styles.navItemHover,
                    pressed  && styles.navItemPressed,
                  ]}>
                  {active && <View style={styles.activeBar} />}
                  <View style={[styles.navIcon, active && styles.navIconActive]}>
                    <Text style={[styles.navIconText, active && styles.navIconTextActive]}>
                      {item.symbol}
                    </Text>
                  </View>
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </ScrollView>

        {/* Footer status */}
        <View style={styles.sidebarFooter}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>API Online · Render</Text>
          </View>
        </View>

      </View>

      {/* ── Right: top bar + content ─────────────────── */}
      <View style={styles.rightArea}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>{PAGE_TITLE[activeRoute]}</Text>
          <View style={styles.topBarRight}>
            <View style={styles.statusChip}>
              <View style={styles.statusChipDot} />
              <Text style={styles.statusChipText}>API Conectada</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AE</Text>
            </View>
          </View>
        </View>

        {/* Page content */}
        <View style={styles.contentArea}>
          {children}
        </View>

      </View>
    </View>
  );
}

const SIDEBAR_BG  = '#283A9B';
const TOP_BAR_BG  = '#FFFFFF';

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.background,
    flex: 1,
    flexDirection: 'row',
  },

  /* ── Sidebar ──────────────────────────────── */
  sidebar: {
    backgroundColor: SIDEBAR_BG,
    boxShadow: '2px 0 6px rgba(0,0,0,0.22)',
    elevation: 4,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    width: 220,
  },

  brand: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.10)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  brandIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  brandIconText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  brandText: {
    flex: 1,
  },
  brandName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  brandSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    marginTop: 1,
  },

  navScroll: {
    flex: 1,
  },
  navContent: {
    gap: 2,
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  navItem: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
    overflow: 'hidden',
    paddingHorizontal: 8,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  navItemHover: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  navItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.20)',
  },

  activeBar: {
    backgroundColor: '#ffffff',
    bottom: 0,
    borderBottomRightRadius: 2,
    borderTopRightRadius: 2,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 3,
  },

  navIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 5,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  navIconActive: {
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  navIconText: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 13,
  },
  navIconTextActive: {
    color: '#ffffff',
  },
  navLabel: {
    color: 'rgba(255,255,255,0.75)',
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  sidebarFooter: {
    borderTopColor: 'rgba(255,255,255,0.10)',
    borderTopWidth: 1,
    padding: 14,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statusDot: {
    backgroundColor: '#22c55e',
    borderRadius: 99,
    height: 6,
    width: 6,
  },
  statusText: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 11,
  },

  /* ── Right area ───────────────────────────── */
  rightArea: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },

  topBar: {
    alignItems: 'center',
    backgroundColor: TOP_BAR_BG,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    elevation: 2,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  topBarTitle: {
    color: colors.neutralText,
    fontSize: 16,
    fontWeight: '700',
  },
  topBarRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  statusChip: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipDot: {
    backgroundColor: '#16A34A',
    borderRadius: 99,
    height: 6,
    width: 6,
  },
  statusChipText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '600',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: SIDEBAR_BG,
    borderRadius: 99,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  contentArea: {
    flex: 1,
    overflow: 'hidden',
  },
});
