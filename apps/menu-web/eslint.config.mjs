import { FlatCompat } from '@eslint/eslintrc';
import config from '@menvi/config/eslint';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...config,
  ...compat.extends('next/core-web-vitals'),
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
];

export default eslintConfig;
