/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL for builds served from a different origin than the backend. */
  readonly VITE_API_URL?: string;
  /** Legacy alias for VITE_API_URL. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
