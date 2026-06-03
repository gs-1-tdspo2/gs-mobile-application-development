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

const navigationItems: { key: AppRoute; label: string; href: Href; description: string }[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/', description: 'Resumo operacional' },
  { key: 'regioes', label: 'Regiões', href: '/regioes', description: 'Monitoramento' },
  {
    key: 'gerenciar',
    label: 'Gerenciar',
    href: '/gerenciar-regioes',
    description: 'Cadastro e CRUD',
  },
  { key: 'alertas', label: 'Alertas', href: '/alertas', description: 'Ocorrências' },
  { key: 'indicadores', label: 'Indicadores', href: '/indicadores', description: 'Analytics leve' },
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
            <Text style={styles.brandCaption}>Monitoring Dashboard</Text>
          </View>
        </View>

        <View style={styles.nav}>
          {navigationItems.map((item) => {
            const isActive = item.key === activeRoute;

            return (
              <Link key={item.key} href={item.href} asChild>
                <Pressable
                  accessibilityRole="link"
                  style={({ pressed }) => [
                    styles.navItem,
                    isActive && styles.navItemActive,
                    pressed && styles.navItemPressed,
                  ]}>
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.navDescription, isActive && styles.navDescriptionActive]}>
                    {item.description}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>

        <View style={styles.sidebarFooter}>
          <Text style={styles.footerLabel}>API Demo</Text>
          <Text style={styles.footerText}>Render conectado via EXPO_PUBLIC_API_BASE_URL.</Text>
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
    borderRightColor: colors.navBorder,
    borderRightWidth: 1,
    gap: spacing.xl,
    padding: spacing.lg,
    width: 272,
  },
  brandBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.navActive,
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
  nav: {
    gap: spacing.sm,
  },
  navItem: {
    borderColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  navItemActive: {
    backgroundColor: colors.navActive,
    borderColor: colors.analyticsBorder,
  },
  navItemPressed: {
    opacity: 0.84,
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
    backgroundColor: colors.navPanel,
    borderColor: colors.analyticsBorder,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: 'auto',
    padding: spacing.md,
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

