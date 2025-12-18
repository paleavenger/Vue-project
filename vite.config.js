import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // имя репозитория на GitHub: Vue-project
  // это нужно для корректной работы путей при публикации на GitHub Pages
  base: '/Vue-project/',
})
