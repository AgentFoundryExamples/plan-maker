/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOFTWARE_PLANNER_BASE_URL: string;
  readonly VITE_SPEC_CLARIFIER_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
