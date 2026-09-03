// eslint.config.js

// import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      quotes: [
        'warn',
        'single',
        { avoidEscape: true, allowTemplateLiterals: true },
      ],
      semi: ['error', 'never'],
      indent: ['warn', 2],
      'no-extra-parens': 'warn',
      'no-nested-ternary': 'error',
      'linebreak-style': 'off',
      'no-cond-assign': ['error', 'always'],
      'no-console': 'off',
      'no-unused-vars': 'warn'
    },
  },
]
