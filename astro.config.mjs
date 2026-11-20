import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://elijahwalker.dev',
  // Inline the CSS (~12 KB gzipped) into each page, so the first paint waits on no stylesheet request.
  build: { inlineStylesheets: 'always' },
});
