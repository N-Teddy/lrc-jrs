/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_INTAKE_URL?: string;
  readonly VITE_APP_ENV?: 'development' | 'production' | 'staging';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
