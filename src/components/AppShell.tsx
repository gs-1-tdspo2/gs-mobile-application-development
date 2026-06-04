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
    label: 'Gerenciar Regiões',
    href: '/gerenciar-regioes',
    description: 'Cadastro e CRUD',
    marker: 'G',
  },
  { key: 'alertas', label: 'Alertas', href: '/alertas', description: 'Ocorrências', marker: 'A' },
  { key: 'indicadores', label: 'Indicadores', href: '/indicadores', description: 'Analytics leve', marker: 'I' },
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
    backgroundColor: colors.navDark,
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    backgroundColor: colors.navDark,
    borderRightColor: '#4258B8',
    borderRightWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    width: 292,
  },
  brandBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.activeNav,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  brandMarkText: {
    color: colors.offWhite,
    fontSize: 22,
    fontWeight: '800',
  },
  brandName: {
    color: colors.offWhite,
    fontSize: 20,
    fontWeight: '800',
  },
  brandCaption: {
    color: colors.analyticsSurface,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  navSection: {
    marginTop: spacing.sm,
  },
  sectionLabel: {
    color: colors.analyticsMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  nav: {
    gap: spacing.sm,
  },
  navItem: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  navItemHover: {
    backgroundColor: '#3347A8',
    borderColor: '#4258B8',
  },
  navItemActive: {
    backgroundColor: colors.navActive,
    borderColor: '#7B8AE6',
    shadowColor: colors.activeNav,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  navItemPressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
  },
  navMarker: {
    alignItems: 'center',
    backgroundColor: '#3347A8',
    borderColor: '#4258B8',
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  navMarkerActive: {
    backgroundColor: colors.offWhite,
    borderColor: colors.offWhite,
  },
  navMarkerText: {
    color: colors.analyticsSurface,
    fontSize: 13,
    fontWeight: '800',
  },
  navMarkerTextActive: {
    color: colors.primaryBase,
  },
  navText: {
    flex: 1,
    gap: 2,
  },
  navLabel: {
    color: colors.analyticsSurface,
    fontSize: 15,
    fontWeight: '800',
  },
  navLabelActive: {
    color: colors.offWhite,
  },
  navDescription: {
    color: colors.analyticsMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  navDescriptionActive: {
    color: colors.primaryLight,
  },
  sidebarFooter: {
    backgroundColor: '#3347A8',
    borderColor: '#6577D6',
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: 'auto',
    padding: spacing.md,
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
