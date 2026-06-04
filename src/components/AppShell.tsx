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
  { key: 'dashboard',   label: 'Dashboard',         href: '/',                  symbol: '⊞' },
  { key: 'regioes',     label: 'Regiões',            href: '/regioes',           symbol: '◎' },
  { key: 'gerenciar',   label: 'Gerenciar Regiões',  href: '/gerenciar-regioes', symbol: '⊕' },
  { key: 'alertas',     label: 'Alertas',            href: '/alertas',           symbol: '△' },
  { key: 'indicadores', label: 'Indicadores',        href: '/indicadores',       symbol: '≡' },
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

        {/* Brand — Amanajé only, no subtitle */}
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>A</Text>
          </View>
          <Text style={styles.brandName}>Amanajé</Text>
        </View>

        <View style={styles.divider} />

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
                  {/* Left accent strip for active item */}
                  {active && <View style={styles.activeBar} />}

                  {/* Icon box — flexShrink: 0 prevents it from collapsing */}
                  <View style={[styles.navIcon, active && styles.navIconActive]}>
                    <Text style={[styles.navIconText, active && styles.navIconTextActive]}>
                      {item.symbol}
                    </Text>
                  </View>

                  {/* Label — numberOfLines prevents wrap-under-icon */}
                  <Text
                    numberOfLines={1}
                    style={[styles.navLabel, active && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={styles.sidebarFooter}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>API Online</Text>
          </View>
        </View>

      </View>

      {/* ── Right: top bar + page content ───────────── */}
      <View style={styles.rightArea}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>{PAGE_TITLE[activeRoute]}</Text>
          <View style={styles.topBarRight}>
            <View style={styles.statusChip}>
              <View style={styles.statusChipDot} />
              <Text style={styles.statusChipText}>Render conectado</Text>
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

const SIDEBAR_BG = '#283A9B';

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.background,
    flex: 1,
    flexDirection: 'row',
  },

  /* ── Sidebar ──────────────────────────────── */
  sidebar: {
    backgroundColor: SIDEBAR_BG,
    boxShadow: '2px 0 8px rgba(0,0,0,0.28)',
    elevation: 4,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    width: 220,
  },

  /* Brand: icon + name only, no subtitle */
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    height: 60,
    paddingHorizontal: 16,
  },
  brandIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    flexShrink: 0,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  brandIconText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  brandName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  divider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    height: 1,
    marginHorizontal: 12,
    marginBottom: 8,
  },

  /* Nav scroll area */
  navScroll: {
    flex: 1,
  },
  navContent: {
    gap: 2,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },

  /* Nav row: strictly horizontal, icon left, label right */
  navItem: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 10,
    height: 44,
    overflow: 'hidden',
    paddingLeft: 8,
    paddingRight: 12,
    position: 'relative',
    width: '100%',
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  navItemHover: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  navItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },

  activeBar: {
    backgroundColor: '#ffffff',
    bottom: 6,
    borderRadius: 2,
    left: 0,
    position: 'absolute',
    top: 6,
    width: 3,
  },

  navIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 5,
    flexShrink: 0,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  navIconActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  navIconText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 14,
  },
  navIconTextActive: {
    color: '#ffffff',
  },

  /* Label: flex 1 so it fills row, numberOfLines=1 prevents wrap */
  navLabel: {
    color: 'rgba(255,255,255,0.78)',
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  navLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  /* Footer */
  sidebarFooter: {
    borderTopColor: 'rgba(255,255,255,0.10)',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    color: 'rgba(255,255,255,0.45)',
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
    backgroundColor: '#ffffff',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    elevation: 2,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  topBarTitle: {
    color: colors.neutralText,
    fontSize: 15,
    fontWeight: '700',
  },
  topBarRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
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
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },

  contentArea: {
    flex: 1,
    overflow: 'hidden',
  },
});
