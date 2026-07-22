import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://skills.yakoshi.dev',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
