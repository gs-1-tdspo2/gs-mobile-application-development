import { Platform, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius } from '@constants/design';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// ─── Nav items ────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: IoniconName;
  activeIcon: IoniconName;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  { label: 'Regiões', path: '/regioes', icon: 'map-outline', activeIcon: 'map' },
  { label: 'Alertas', path: '/alertas', icon: 'notifications-outline', activeIcon: 'notifications' },
  { label: 'Estações', path: '/estacoes', icon: 'radio-outline', activeIcon: 'radio' },
  { label: 'Indicadores', path: '/indicadores', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
];

// ─── Desktop sidebar ──────────────────────────────────────────────────────────

function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={sidebar.rail}>
      {/* Brand */}
      <View style={sidebar.brand}>
        <Text style={sidebar.brandName}>AMANAJÉ</Text>
        <Text style={sidebar.brandSub}>Monitoramento</Text>
      </View>

      {/* Nav items */}
      <View style={sidebar.nav}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <TouchableOpacity
              key={item.path}
              style={[sidebar.navItem, isActive && sidebar.navItemActive]}
              onPress={() => router.push(item.path as Parameters<typeof router.push>[0])}
              activeOpacity={0.75}
            >
              <Ionicons
                name={isActive ? item.activeIcon : item.icon}
                size={20}
                color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.60)'}
              />
              <Text style={[sidebar.navLabel, isActive && sidebar.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={sidebar.footer}>
        <Text style={sidebar.footerText}>GS · FIAP 2025</Text>
      </View>
    </View>
  );
}

const RAIL_WIDTH = 220;

const sidebar = StyleSheet.create({
  rail: {
    width: RAIL_WIDTH,
    backgroundColor: Colors.primary,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexDirection: 'column',
  },
  brand: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  brandName: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  brandSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.60)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  nav: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    rowGap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  navLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.60)',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.35)',
  },
});

// ─── Tab icon helper ──────────────────────────────────────────────────────────

function tabIcon(focused: boolean, active: IoniconName, inactive: IoniconName) {
  return ({ color }: { color: string }) => (
    <Ionicons name={focused ? active : inactive} size={22} color={color} />
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const tabBarStyle = isDesktop
    ? { display: 'none' as const }
    : {
        backgroundColor: Colors.card,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: 72,
        paddingBottom: 14,
        paddingTop: 8,
      };

  const headerStyle = isDesktop
    ? { backgroundColor: Colors.card }
    : { backgroundColor: Colors.primary };

  const headerTintColor = isDesktop ? Colors.text : Colors.card;

  const tabs = (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '500',
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          height: 72,
          justifyContent: 'center',
        },
        headerStyle,
        headerTintColor,
        headerTitleStyle: { fontWeight: '600', fontSize: FontSize.lg },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) =>
            tabIcon(focused, 'grid', 'grid-outline')({ color: color as string }),
        }}
      />
      <Tabs.Screen
        name="regioes"
        options={{
          title: 'Regiões',
          headerShown: false,
          tabBarIcon: ({ focused, color }) =>
            tabIcon(focused, 'map', 'map-outline')({ color: color as string }),
        }}
      />
      <Tabs.Screen
        name="alertas"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ focused, color }) =>
            tabIcon(focused, 'notifications', 'notifications-outline')({ color: color as string }),
        }}
      />
      <Tabs.Screen
        name="estacoes"
        options={{
          title: 'Estações',
          tabBarIcon: ({ focused, color }) =>
            tabIcon(focused, 'radio', 'radio-outline')({ color: color as string }),
        }}
      />
      <Tabs.Screen
        name="indicadores"
        options={{
          title: 'Indicadores',
          tabBarIcon: ({ focused, color }) =>
            tabIcon(focused, 'bar-chart', 'bar-chart-outline')({ color: color as string }),
        }}
      />
    </Tabs>
  );

  if (isDesktop) {
    return (
      <View style={layout.root}>
        <DesktopSidebar />
        <View style={layout.main}>{tabs}</View>
      </View>
    );
  }

  return tabs;
}

const layout = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  main: {
    flex: 1,
  },
});
