import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    // Global ignores
    ignores: [
      'dist',
      'node_modules',
      'build',
      'coverage',
      '*.config.js',
      '*.config.ts',
      'src/api/softwarePlanner/models/',
      'src/api/specClarifier/models/',
    ],
  },
  {
    // Base configuration for all files
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests and generated code
      'no-control-regex': 'off', // Allow control characters in regex
      'no-undef': 'off', // TypeScript handles this

      // Import rules - kept disabled to avoid resolver conflicts in ESLint v9 flat config
      // The import plugin has known compatibility issues with ESLint v9's flat config format
      // when used with TypeScript path aliases. TypeScript and Vite handle import resolution,
      // so these rules are not critical for build/runtime correctness.
      // See: https://github.com/import-js/eslint-plugin-import/issues/2556
      'import/order': 'off',
      'import/no-unresolved': 'off',
    },
  },
  // Prettier config should be last
  eslintConfigPrettier,
];
