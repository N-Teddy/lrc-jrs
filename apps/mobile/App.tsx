import { CoreProviders } from '@jrs/client-core';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { getApiBaseUrl } from './src/config/api.config';
import { mobileSecureStoreAdapter } from './src/storage/secure-store.adapter';

const API_BASE_URL = getApiBaseUrl();

function AppContent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LRC JRS Mobile</Text>
      <Text style={styles.subtitle}>
        Foundation ready. Ready for UI implementation.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <CoreProviders
      storageAdapter={mobileSecureStoreAdapter}
      baseUrl={API_BASE_URL}
    >
      <AppContent />
    </CoreProviders>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
