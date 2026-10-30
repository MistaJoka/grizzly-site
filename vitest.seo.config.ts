/// <reference types="vitest/config" />
// Build-output audit: runs against dist/ after `npm run build`, kept apart from the unit config so
// `npm run test:unit` stays fast and never depends on a build.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/seo/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
