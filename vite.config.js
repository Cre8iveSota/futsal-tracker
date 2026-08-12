import { defineConfig } from 'vite';

// GitHub Pages project site is served from https://<user>.github.io/futsal-tracker/
// so all built asset URLs need that path prefix.
export default defineConfig({
  base: '/futsal-tracker/',
});
