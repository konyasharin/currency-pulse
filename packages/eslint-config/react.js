import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

import baseConfig from './index.js'

export default [
  ...baseConfig,
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-no-literals': ['warn', { noStrings: true, ignoreProps: true }],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
]
