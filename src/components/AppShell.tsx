import { Href, Link } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useResponsiveLayout } from '@/utils/responsive';

type AppRoute = 'dashboard' | 'regioes' | 'gerenciar' | 'alertas' | 'indicadores';

type AppShellProps = PropsWithChildren<{
  activeRoute: AppRoute;
}>;

type NavItem = {
  key: AppRoute;
  label: string;
  href: Href;
  sub: string;
  symbol: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',   label: 'Dashboard',   href: '/',                  sub: 'Resumo operacional',  symbol: '⊞' },
  { key: 'regioes',     label: 'Regiões',      href: '/regioes',           sub: 'Monitoramento',        symbol: '◎' },
  { key: 'gerenciar',   label: 'Gerenciar',    href: '/gerenciar-regioes', sub: 'Cadastro e CRUD',      symbol: '⊕' },
  { key: 'alertas',     label: 'Alertas',      href: '/alertas',           sub: 'Ocorrências',          symbol: '△' },
  { key: 'indicadores', label: 'Indicadores',  href: '/indicadores',       sub: 'Analytics',            symbol: '≡' },
];

export function AppShell({ activeRoute, children }: AppShellProps) {
  const { isDesktop } = useResponsiveLayout();

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <View style={styles.shell}>
      <View style={styles.sidebar}>

        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.brandLogo}>
            <Text style={styles.brandLogoText}>A</Text>
          </View>
          <View>
            <Text style={styles.brandName}>Amanajé</Text>
            <Text style={styles.brandSub}>Monitoramento Ambiental</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Section label */}
        <Text style={styles.sectionLabel}>OPERAÇÃO</Text>

        {/* Nav */}
        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = item.key === activeRoute;
            return (
              <Link key={item.key} href={item.href} asChild>
                <Pressable
                  accessibilityRole="link"
                  style={({ hovered, pressed }) => [
                    styles.navItem,
                    active    && styles.navActive,
                    hovered && !active && styles.navHover,
                    pressed   && styles.navPressed,
                  ]}>
                  {active && <View style={styles.activeStrip} />}
                  <View style={[styles.symbol, active && styles.symbolActive]}>
                    <Text style={[styles.symbolText, active && styles.symbolTextActive]}>
                      {item.symbol}
                    </Text>
                  </View>
                  <View style={styles.navTextBlock}>
                    <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.navSub, active && styles.navSubActive]}>
                      {item.sub}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </View>

        {/* Footer status */}
        <View style={styles.statusBlock}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusLabel}>API Online</Text>
          </View>
          <Text style={styles.statusSub}>Render · gs-java-advanced</Text>
        </View>

      </View>

      <View style={styles.main}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.background,
    flex: 1,
    flexDirection: 'row',
  },

  /* ── Sidebar ─────────────────────────────────── */
  sidebar: {
    backgroundColor: colors.primary700,
    boxShadow: '2px 0 8px rgba(0,0,0,0.28)',
    elevation: 4,
    paddingBottom: 20,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    width: 260,
  },

  /* Brand */
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  brandLogo: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  brandLogoText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  brandName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  brandSub: {
    color: colors.primary200,
    fontSize: 11,
    marginTop: 1,
  },

  divider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    height: 1,
    marginHorizontal: 16,
    marginBottom: 12,
  },

  sectionLabel: {
    color: colors.primary300,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
    paddingHorizontal: 20,
  },

  /* Nav items */
  nav: {
    gap: 2,
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 12,
    minHeight: 44,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 6,
    position: 'relative',
  },
  navActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  navHover: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  navPressed: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  activeStrip: {
    backgroundColor: colors.accent300,
    bottom: 0,
    borderBottomRightRadius: 3,
    borderTopRightRadius: 3,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 3,
  },

  symbol: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 6,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  symbolActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  symbolText: {
    color: colors.primary200,
    fontSize: 14,
    fontWeight: '700',
  },
  symbolTextActive: {
    color: '#ffffff',
  },

  navTextBlock: {
    flex: 1,
    gap: 1,
  },
  navLabel: {
    color: colors.primary100,
    fontSize: 14,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  navSub: {
    color: colors.primary300,
    fontSize: 11,
  },
  navSubActive: {
    color: colors.primary200,
  },

  /* Footer status */
  statusBlock: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 6,
    borderWidth: 1,
    gap: 3,
    marginHorizontal: 12,
    marginTop: 'auto',
    padding: 12,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statusDot: {
    backgroundColor: '#22c55e',
    borderRadius: 99,
    height: 7,
    width: 7,
  },
  statusLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  statusSub: {
    color: colors.primary300,
    fontSize: 11,
  },

  /* Main content area */
  main: {
    backgroundColor: colors.background,
    flex: 1,
    overflow: 'hidden',
  },
});
