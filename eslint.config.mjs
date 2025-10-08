import next from 'eslint-config-next';

export default [
  ...next,
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
    ],
    rules: {
      // Temporarily relax highly strict rules to unblock the codebase
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react/no-unescaped-entities': 'off',
      'prefer-const': 'warn',
    },
  },
];

