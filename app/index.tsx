import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useWarmUp } from '@hooks/useWarmUp';
import { WarmUpScreen } from '@components/ui';

export default function Index() {
  const router = useRouter();
  const { status, start } = useWarmUp();

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (status === 'ready') {
      router.replace('/context-selector');
    }
  }, [status, router]);

  return <WarmUpScreen status={status} onRetry={start} />;
}
