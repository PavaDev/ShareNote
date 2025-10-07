import { createRouter, createWebHistory } from 'vue-router'
import store from "../../store"

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../../views/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../../views/Home.vue'),
    meta: { requiresAuth: true }
  },

  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('../../views/Favorite.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/:username?',
    name: 'Profile',
    component: () => import('../../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../../views/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: () => import('../../views/AdminPanel.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('../../views/AuthCallback.vue')
  },
  {
  path: '/notes/:id',
  name: 'NoteDetail',
  component: () => import('../../views/NoteDetail.vue'),
  props: true,
  meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated']
  const isAdmin = store.getters['auth/isAdmin']
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next('/')
  } else if (to.meta.requiresAdmin && !isAdmin) {
    next('/')
  } else {
    next()
  }
})

export default router