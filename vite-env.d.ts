/// <reference types="vite/client" />

declare module 'alpinejs';

interface ImportMetaEnv {
  readonly VITE_GAS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
