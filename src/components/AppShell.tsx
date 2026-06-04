import { Href, useRouter } from 'expo-router';
import { PropsWithChildren, useState } from 'react';
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

type NavRowProps = { item: NavItem; active: boolean; onPress: () => void };

function NavRow({ item, active, onPress }: NavRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.navItem,
        hovered && !active && styles.navItemHovered,
        active && styles.navItemActive,
      ]}>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

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
          {NAV_ITEMS.map((item) => (
            <NavRow
              key={item.key}
              item={item}
              active={item.key === activeRoute}
              onPress={() => router.push(item.href)}
            />
          ))}
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
    backgroundColor: '#F4F5F7',
  },

  sidebar: {
    width: 240,
    backgroundColor: '#3F51B5',
    flexDirection: 'column',
  },

  brand: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  brandText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  nav: {
    flex: 1,
  },
  // borderLeftWidth is always 3 on every nav item (transparent when inactive).
  // This keeps text horizontally aligned whether or not the active border is showing.
  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  navItemHovered: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderLeftColor: '#ffffff',
  },
  navLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
  },
  navLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  main: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
});
