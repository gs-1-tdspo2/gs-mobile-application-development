import { Href, Link } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useResponsiveLayout } from '@/utils/responsive';

export type AppRoute = 'dashboard' | 'regioes' | 'gerenciar' | 'alertas' | 'indicadores';

type AppShellProps = PropsWithChildren<{
  activeRoute: AppRoute;
}>;

type NavItem = { key: AppRoute; label: string; href: Href; icon: string };

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',   label: 'Dashboard',         href: '/',                  icon: '▪' },
  { key: 'regioes',     label: 'Regiões',            href: '/regioes',           icon: '▪' },
  { key: 'gerenciar',   label: 'Gerenciar Regiões',  href: '/gerenciar-regioes', icon: '▪' },
  { key: 'alertas',     label: 'Alertas',            href: '/alertas',           icon: '▪' },
  { key: 'indicadores', label: 'Indicadores',        href: '/indicadores',       icon: '▪' },
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

        {/* Brand — text only, no icon block */}
        <View style={styles.brand}>
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
                {/*
                  No accessibilityRole="link" here — that would make RN Web
                  render this as an <a> with display:inline, breaking flex layout.
                  The outer <Link> already provides the anchor for web.
                */}
                <Pressable
                  style={({ hovered, pressed }) => [
                    styles.navItem,
                    active   && styles.navItemActive,
                    hovered && !active && styles.navItemHover,
                    pressed  && styles.navItemPressed,
                  ]}>
                  {active && <View style={styles.activeBar} />}

                  {/* Icon dot — fixed width, no shrink */}
                  <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                    <View style={[styles.iconDot, active && styles.iconDotActive]} />
                  </View>

                  {/* Label — flex:1 + minWidth:0 prevents wrapping under icon */}
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
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

const SIDEBAR_BG = '#2B3A9F';

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

  /* Brand: name only */
  brand: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  brandName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  divider: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    height: 1,
    marginHorizontal: 0,
    marginBottom: 6,
  },

  /* Nav scroll area */
  navScroll: {
    flex: 1,
  },
  navContent: {
    gap: 1,
    paddingBottom: 8,
    paddingHorizontal: 6,
    paddingTop: 4,
  },

  /*
   * Nav row: MUST be horizontal.
   * display:'flex' overrides any browser <a> inline default.
   * width:'100%' fills the sidebar column.
   * overflow:'hidden' clips long labels.
   */
  navItem: {
    alignItems: 'center',
    borderRadius: 5,
    display: 'flex',
    flexDirection: 'row',
    height: 40,
    overflow: 'hidden',
    paddingHorizontal: 10,
    position: 'relative',
    width: '100%',
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  navItemHover: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  navItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.26)',
  },

  /* Left accent strip on active row */
  activeBar: {
    backgroundColor: '#ffffff',
    borderBottomRightRadius: 2,
    borderTopRightRadius: 2,
    bottom: 6,
    left: 0,
    position: 'absolute',
    top: 6,
    width: 3,
  },

  /* Fixed-size icon area — prevents any collapse */
  iconWrap: {
    alignItems: 'center',
    flexShrink: 0,
    height: 20,
    justifyContent: 'center',
    marginRight: 10,
    width: 16,
  },
  iconWrapActive: {},
  iconDot: {
    backgroundColor: 'rgba(255,255,255,0.40)',
    borderRadius: 99,
    height: 6,
    width: 6,
  },
  iconDotActive: {
    backgroundColor: '#ffffff',
    height: 8,
    width: 8,
  },

  /* Label — flex:1 + minWidth:0 ensures it fills without wrapping */
  navLabel: {
    color: 'rgba(255,255,255,0.72)',
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    minWidth: 0,
  },
  navLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  /* Footer */
  sidebarFooter: {
    borderTopColor: 'rgba(255,255,255,0.12)',
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
    color: 'rgba(255,255,255,0.40)',
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

  contentArea: {
    flex: 1,
    overflow: 'hidden',
  },
});
