import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  {
    // 무시할 파일들
    ignores: ['dist'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
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
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // React 19 대응 규칙들
      'react/react-in-jsx-scope': 'off', // React 19에서는 자동 import
      'react/jsx-uses-react': 'off', // React 19에서는 불필요
      'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
      'react/prop-types': 'off', // TypeScript나 다른 타입 검사 도구 사용 시

      // 개발 환경 최적화
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // 코드 품질 규칙
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
    },
  },
];
