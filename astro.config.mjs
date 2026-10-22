import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://blog.andou.eu.org',
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light-default',
        dark: 'github-dark-default',
      },
      defaultColor: false,
    },
  },
});
