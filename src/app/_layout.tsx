import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

import { colors } from '@/constants/colors';

const isWeb = Platform.OS === 'web';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: !isWeb,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.offWhite,
          headerTitleStyle: { fontWeight: '700' },
        }}>
        <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
        <Stack.Screen name="regioes/index" options={{ title: 'Regiões monitoradas' }} />
        <Stack.Screen name="regioes/[id]" options={{ title: 'Detalhe da região' }} />
        <Stack.Screen name="gerenciar-regioes" options={{ title: 'Gerenciar Regiões' }} />
        <Stack.Screen name="alertas" options={{ title: 'Alertas' }} />
        <Stack.Screen name="indicadores" options={{ title: 'Indicadores' }} />
      </Stack>
    </>
  );
}
