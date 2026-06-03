import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { screenStyles } from '@/styles/global';

export default function AlertasScreen() {
  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ScrollView contentContainerStyle={screenStyles.scrollContent}>
        <Text style={screenStyles.title}>Alertas ambientais</Text>
        <EmptyState
          title="Alertas em preparacao"
          description="A futura integracao exibira alertas ativos e a acao para marcar resolucao."
        />
      </ScrollView>
    </SafeAreaView>
  );
}
