import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Login from './pages/Login.vue'
import Mood from './pages/Mood.vue'
import Manager from './pages/Manager.vue'
import './style.css'

const routes = [
  { path: '/', component: Login },
  { path: '/mood', component: Mood },
  { path: '/manager', component: Manager },
]
const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const jwt = localStorage.getItem('jwt')
  const role = localStorage.getItem('role') // 'manager' | 'employee' | null
  const username = localStorage.getItem('username') // pour déterminer le rôle
  
  if (!jwt && to.path !== '/') return next('/')            // pas loggé
  
  // Détermine le rôle basé sur le nom d'utilisateur
  const userRole = username === 'manager' ? 'manager' : 'employee'
  
  if (userRole === 'manager' && to.path === '/mood') return next('/manager')
  if (userRole === 'employee' && to.path === '/manager') return next('/mood')
  next()
})

createApp(App).use(router).mount('#app')
