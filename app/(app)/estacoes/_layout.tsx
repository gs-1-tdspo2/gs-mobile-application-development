import { Platform, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@constants/colors';
import { FontSize } from '@constants/design';

export default function EstacoesLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: isDesktop ? Colors.card : Colors.primary },
        headerTintColor: isDesktop ? Colors.text : Colors.card,
        headerTitleStyle: { fontWeight: '600', fontSize: FontSize.lg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Estações' }} />
    </Stack>
  );
}
