import { Href, useRouter } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useResponsiveLayout } from '@/utils/responsive';

export type AppRoute = 'dashboard' | 'regioes' | 'gerenciar' | 'alertas' | 'indicadores';

type AppShellProps = PropsWithChildren<{
  activeRoute: AppRoute;
}>;

type NavItem = { key: AppRoute; label: string; href: Href };

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',   label: 'Dashboard',         href: '/'                  },
  { key: 'regioes',     label: 'Regiões',            href: '/regioes'           },
  { key: 'gerenciar',   label: 'Gerenciar Regiões',  href: '/gerenciar-regioes' },
  { key: 'alertas',     label: 'Alertas',            href: '/alertas'           },
  { key: 'indicadores', label: 'Indicadores',        href: '/indicadores'       },
];

export function AppShell({ activeRoute, children }: AppShellProps) {
  const { isDesktop } = useResponsiveLayout();
  const router = useRouter();

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <View style={styles.shell}>
      <View style={styles.sidebar}>
        <View style={styles.brand}>
          <Text style={styles.brandText}>Amanajé</Text>
        </View>

        <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
          {NAV_ITEMS.map((item) => {
            const active = item.key === activeRoute;
            return (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.href)}
                style={[styles.navItem, active && styles.navItemActive]}>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.main}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },

  sidebar: {
    width: 220,
    backgroundColor: '#3F51B5',
    flexDirection: 'column',
  },

  brand: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  brandText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },

  nav: {
    flex: 1,
  },
  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  navLabel: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
  },
  navLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  main: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
