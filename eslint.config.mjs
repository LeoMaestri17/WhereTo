import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // An underscore prefix is how this codebase says "destructured to drop it, on purpose".
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  /*
   * The key boundary, enforced by the toolchain rather than by remembering.
   *
   * Every surface under app/ and components/ is a client component, and lib/pricing and
   * lib/budget read process.env.SERPAPI_API_KEY. One import from the wrong side publishes the
   * key in the browser bundle, which is a critical bug rather than a style problem.
   *
   * `server-only` cannot do this job here: it throws in plain Node, which would break the warm
   * script and every offline probe that imports the pricing layer on purpose. A lint rule fails
   * `npm run check` instead, which is the same wall in a place that can actually hold it.
   *
   * The app has no legitimate reason to cross this line. It reads prices from
   * lib/cache/quotes.ts, which is a JSON import holding no keys and reaching no network.
   */
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/pricing', '@/lib/pricing/*', '**/lib/pricing/*'],
              message:
                'The pricing layer holds the SerpApi key and must never reach the browser bundle. Read prices from @/lib/cache/quotes instead.',
            },
            {
              group: ['@/lib/budget', '@/lib/budget/*', '**/lib/budget/*'],
              message:
                'The budget guard is for the warm script, not the app. Nothing a user does may spend quota.',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
