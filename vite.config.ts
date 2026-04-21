import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/tea-ticket/',
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),
        ticket: resolve(__dirname, 'ticket.html'),
        admin:  resolve(__dirname, 'admin.html'),
        manage: resolve(__dirname, 'manage.html'),
      },
    },
  },
});
