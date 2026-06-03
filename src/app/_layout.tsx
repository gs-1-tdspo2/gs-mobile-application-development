import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.deepGreen },
          headerTintColor: colors.offWhite,
          headerTitleStyle: { fontWeight: '700' },
        }}>
        <Stack.Screen name="index" options={{ title: 'Amanajé' }} />
        <Stack.Screen name="regioes/index" options={{ title: 'Regiões monitoradas' }} />
        <Stack.Screen name="regioes/[id]" options={{ title: 'Detalhe da região' }} />
        <Stack.Screen name="gerenciar-regioes" options={{ title: 'Gerenciar regiões' }} />
        <Stack.Screen name="alertas" options={{ title: 'Alertas ambientais' }} />
        <Stack.Screen name="indicadores" options={{ title: 'Indicadores' }} />
      </Stack>
    </>
  );
}
