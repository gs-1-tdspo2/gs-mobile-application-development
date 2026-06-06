import { useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import { RegiaoForm } from '@components/regioes/RegiaoForm';
import { useCreateRegiao } from '@hooks/useCreateRegiao';
import { useToast } from '@contexts/ToastContext';
import type { CreateRegiaoRequest } from '@/types';

export default function NovaRegiaoScreen() {
  const router = useRouter();
  const { status, error, execute } = useCreateRegiao();
  const { showToast } = useToast();

  const handleSubmit = useCallback(async (data: CreateRegiaoRequest) => {
    const result = await execute(data);
    if (result) {
      showToast(`Região "${result.nome}" cadastrada com sucesso.`);
      router.back();
    }
  }, [execute, router, showToast]);

  return (
    <>
      <Stack.Screen options={{ title: 'Nova Região Monitorada' }} />
      <RegiaoForm
        onSubmit={handleSubmit}
        isLoading={status === 'loading'}
        error={status === 'error' ? error : null}
        submitLabel="Cadastrar região"
      />
    </>
  );
}
