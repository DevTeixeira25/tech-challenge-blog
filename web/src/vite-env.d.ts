/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base da API REST (ex.: http://localhost:3000). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
