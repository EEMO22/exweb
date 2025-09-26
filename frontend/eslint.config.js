import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import'; // Airbnb 호환성을 위한 import 플러그인
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  {
    // 무시할 파일들
    ignores: ['dist', '*.config.js'],
  },
  {
    // TypeScript + React 파일들
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parser: tsParser, // TypeScript 파서 사용
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: {
        version: '19.1', // React 19 명시적 설정
      },
      // Import 해석을 위한 설정
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint,
      import: importPlugin, // import 플러그인 추가
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules, // import 규칙 추가

      // React 19 대응 규칙들
      'react/react-in-jsx-scope': 'off', // React 19에서는 자동 import
      'react/jsx-uses-react': 'off', // React 19에서는 불필요
      'react/jsx-filename-extension': [1, { extensions: ['.jsx', '.tsx'] }],
      'react/prop-types': 'off', // TypeScript가 타입 검사를 대신함

      // TypeScript 관련 규칙들 (Guidelines: strict type checking)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // any 타입 사용 시 경고
      '@typescript-eslint/prefer-const': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error', // ! 연산자 사용 금지

      // 개발 환경 최적화
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // 코드 품질 규칙
      'no-unused-vars': 'off', // TypeScript 규칙으로 대체
      'prefer-const': 'off', // TypeScript 규칙으로 대체
      'no-console': 'warn',

      // Import/Export 규칙 수정 (Guidelines: consistency is key)
      'import/prefer-default-export': 'off', // Named export 허용
      'import/extensions': 'off', // TypeScript에서는 확장자 생략 가능
      'import/no-unresolved': 'off', // TypeScript가 해결함
      'import/no-extraneous-dependencies': 'off', // pnpm 호환성
    },
  },
];
