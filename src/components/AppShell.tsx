import { Href, Link } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useResponsiveLayout } from '@/utils/responsive';

type AppRoute = 'dashboard' | 'regioes' | 'gerenciar' | 'alertas' | 'indicadores';

type AppShellProps = PropsWithChildren<{
  activeRoute: AppRoute;
}>;

const navigationItems: {
  key: AppRoute;
  label: string;
  href: Href;
  description: string;
  marker: string;
}[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/', description: 'Resumo operacional', marker: 'D' },
  { key: 'regioes', label: 'Regiões', href: '/regioes', description: 'Monitoramento', marker: 'R' },
  {
    key: 'gerenciar',
    label: 'Gerenciar',
    href: '/gerenciar-regioes',
    description: 'Cadastro e CRUD',
    marker: 'G',
  },
  { key: 'alertas', label: 'Alertas', href: '/alertas', description: 'Ocorrências', marker: 'A' },
  { key: 'indicadores', label: 'Indicadores', href: '/indicadores', description: 'Analytics', marker: 'I' },
];

export function AppShell({ activeRoute, children }: AppShellProps) {
  const { isDesktop } = useResponsiveLayout();

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <View style={styles.shell}>
      <View style={styles.sidebar}>
        <View style={styles.brandBlock}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>A</Text>
          </View>
          <View>
            <Text style={styles.brandName}>Amanajé</Text>
            <Text style={styles.brandCaption}>Monitoramento Ambiental</Text>
          </View>
        </View>

        <View style={styles.navSection}>
          <Text style={styles.sectionLabel}>Operação</Text>
        </View>

        <View style={styles.nav}>
          {navigationItems.map((item) => {
            const isActive = item.key === activeRoute;

            return (
              <Link key={item.key} href={item.href} asChild>
                <Pressable
                  accessibilityRole="link"
                  style={({ hovered, pressed }) => [
                    styles.navItem,
                    hovered && !isActive && styles.navItemHover,
                    isActive && styles.navItemActive,
                    pressed && styles.navItemPressed,
                  ]}>
                  <View style={[styles.navMarker, isActive && styles.navMarkerActive]}>
                    <Text style={[styles.navMarkerText, isActive && styles.navMarkerTextActive]}>
                      {item.marker}
                    </Text>
                  </View>
                  <View style={styles.navText}>
                    <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.navDescription, isActive && styles.navDescriptionActive]}>
                      {item.description}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </View>

        <View style={styles.sidebarFooter}>
          <View style={styles.footerStatusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.footerLabel}>API Render</Text>
          </View>
          <Text style={styles.footerText}>Sistema conectado</Text>
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
  sidebar: {
    backgroundColor: colors.navDark,
    gap: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    width: 260,
  },
  brandBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: 8,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 6,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  brandMarkText: {
    color: colors.offWhite,
    fontSize: 22,
    fontWeight: '800',
  },
  brandName: {
    color: colors.offWhite,
    fontSize: 19,
    fontWeight: '700',
  },
  brandCaption: {
    color: colors.analyticsSurface,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  navSection: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  sectionLabel: {
    color: colors.analyticsMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  nav: {
    gap: 2,
  },
  navItem: {
    alignItems: 'center',
    borderLeftColor: 'transparent',
    borderLeftWidth: 3,
    borderRadius: 4,
    flexDirection: 'row',
    gap: 12,
    minHeight: 42,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  navItemHover: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderLeftColor: colors.accent300,
  },
  navItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    opacity: 0.92,
  },
  navMarker: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 4,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  navMarkerActive: {
    backgroundColor: colors.offWhite,
  },
  navMarkerText: {
    color: colors.analyticsSurface,
    fontSize: 12,
    fontWeight: '700',
  },
  navMarkerTextActive: {
    color: colors.primaryBase,
  },
  navText: {
    flex: 1,
    gap: 0,
  },
  navLabel: {
    color: colors.analyticsSurface,
    fontSize: 14,
    fontWeight: '700',
  },
  navLabelActive: {
    color: colors.offWhite,
  },
  navDescription: {
    color: colors.analyticsMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  navDescriptionActive: {
    color: colors.primaryLight,
  },
  sidebarFooter: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: 'auto',
    padding: 12,
  },
  footerStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusDot: {
    backgroundColor: '#22C55E',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  footerLabel: {
    color: colors.offWhite,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  footerText: {
    color: colors.analyticsSurface,
    fontSize: 12,
    lineHeight: 18,
  },
  main: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
