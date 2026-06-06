import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppContextProvider } from '@contexts/AppContext';
import { ToastProvider } from '@contexts/ToastContext';
import { Colors } from '@constants/colors';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
    <SafeAreaProvider>
      <AppContextProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="context-selector" />
            <Stack.Screen name="(app)" />
            <Stack.Screen
              name="+not-found"
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: Colors.primary },
                headerTintColor: Colors.card,
                title: 'Página não encontrada',
              }}
            />
          </Stack>
        </ToastProvider>
      </AppContextProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
