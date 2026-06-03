import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { screenStyles } from '@/styles/global';

export default function IndicadoresScreen() {
  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ScrollView contentContainerStyle={screenStyles.scrollContent}>
        <Text style={screenStyles.title}>Indicadores regionais</Text>
        <EmptyState
          title="Indicadores aguardando API"
          description="Os indicadores de clima, risco e cobertura regional serao conectados ao backend futuramente."
        />
      </ScrollView>
    </SafeAreaView>
  );
}
