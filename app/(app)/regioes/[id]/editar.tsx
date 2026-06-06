import { useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { RegiaoForm } from '@components/regioes/RegiaoForm';
import { useRegiao } from '@hooks/useRegiao';
import { useUpdateRegiao } from '@hooks/useUpdateRegiao';
import { useToast } from '@contexts/ToastContext';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius } from '@constants/design';
import type { CreateRegiaoRequest } from '@/types';

export default function EditarRegiaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const regiaoId = parseInt(id, 10);
  const router = useRouter();
  const { showToast } = useToast();

  const { status: fetchStatus, data: regiao, errorMessage, load } = useRegiao();
  const { status: updateStatus, error: updateError, execute: update } = useUpdateRegiao();

  useEffect(() => {
    if (!isNaN(regiaoId)) load(regiaoId);
  }, [regiaoId, load]);

  const handleSubmit = useCallback(async (data: CreateRegiaoRequest) => {
    const result = await update(regiaoId, data);
    // PUT returns 200 with body; treat any non-null result as success.
    // If the API ever changes to 204, updateStatus will still be 'success'.
    if (result !== null) {
      showToast(`Região "${result?.nome ?? 'região'}" atualizada com sucesso.`);
      router.back();
    }
  }, [update, regiaoId, router, showToast]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Editar Região' }} />

      {fetchStatus === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando dados da região…</Text>
        </View>
      )}

      {fetchStatus === 'error' && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{errorMessage ?? 'Erro ao carregar região.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(regiaoId)}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {fetchStatus === 'success' && regiao && (
        <RegiaoForm
          initialValues={{
            idCliente:            regiao.idCliente,
            nome:                 regiao.nome,
            cidade:               regiao.cidade,
            estado:               regiao.estado,
            latitude:             regiao.latitude,
            longitude:            regiao.longitude,
            tipoArea:             regiao.tipoArea,
            nivelVulnerabilidade: regiao.nivelVulnerabilidade,
            tipoVisibilidade:     regiao.tipoVisibilidade,
          }}
          onSubmit={handleSubmit}
          isLoading={updateStatus === 'loading'}
          error={updateStatus === 'error' ? updateError : null}
          submitLabel="Atualizar região"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  loadingText: { fontSize: FontSize.md, color: Colors.textMuted },
  errorText: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center' },
  retryBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  retryBtnText: { fontSize: FontSize.md, color: Colors.card, fontWeight: '600' },
});
