import { CoreProviders } from '@jrs/client-core';
import { tauriStoreAdapter } from './storage/tauri-store.adapter';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function AppContent() {
  return (
    <main
      style={{
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1>LRC JRS Desktop</h1>
      <p>Foundation ready. Ready for UI implementation.</p>
    </main>
  );
}

export default function App() {
  return (
    <CoreProviders storageAdapter={tauriStoreAdapter} baseUrl={API_BASE_URL}>
      <AppContent />
    </CoreProviders>
  );
}
