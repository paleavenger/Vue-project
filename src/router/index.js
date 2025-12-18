import { createRouter, createWebHistory } from 'vue-router'
import PaletteGenerator from '../components/PaletteGenerator.vue'
import PaletteLibrary from '../components/PaletteLibrary.vue'
import PaletteExport from '../components/PaletteExport.vue'

const routes = [
  {
    path: '/',
    name: 'generator',
    component: PaletteGenerator,
  },
  {
    path: '/library',
    name: 'library',
    component: PaletteLibrary,
  },
  {
    path: '/export',
    name: 'export',
    component: PaletteExport,
  },
]

const router = createRouter({
  history: createWebHistory('/kr27-30/'),
  routes,
})

export default router


