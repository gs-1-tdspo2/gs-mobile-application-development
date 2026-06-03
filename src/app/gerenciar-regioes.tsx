import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { screenStyles } from '@/styles/global';

export default function GerenciarRegioesScreen() {
  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ScrollView contentContainerStyle={screenStyles.scrollContent}>
        <Text style={screenStyles.title}>Gerenciar regioes</Text>
        <EmptyState
          title="CRUD ainda nao implementado"
          description="Esta tela reserva o espaco para criar, editar e remover regioes apos a proxima etapa."
        />
      </ScrollView>
    </SafeAreaView>
  );
}
