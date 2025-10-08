<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div v-if="!error" class="loading-spinner mb-4"></div>
      <svg v-else class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-gray-600">{{ message }}</p>
      <p v-if="error" class="text-red-600 text-sm mt-2">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import api from '../services/api' // Use your existing API service

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()
    const message = ref('Completing sign in...')
    const error = ref(null)

    onMounted(async () => {
      const token = route.query.token
      const code = route.query.code

      console.log('Auth callback - Token:', token ? 'Present' : 'Missing')
      console.log('Auth callback - Code:', code)
      console.log('API URL:', import.meta.env.VITE_API_URL)

      // Handle suspended account
      if (code === 'account_suspended') {
        message.value = 'Account suspended'
        error.value = 'Your account has been suspended'
        setTimeout(() => router.push('/login'), 3000)
        return
      }

      // Handle successful login
      if (token) {
        try {
          // Store token first
          localStorage.setItem('token', token)
          
          // Fetch user data using your API service
          const response = await api.get('/profile/me')
          
          console.log('User data received:', response.data)
          
          // Store user in Vuex
          store.commit('auth/SET_AUTH', {
            token,
            user: response.data
          })
          
          // Store in localStorage for persistence
          localStorage.setItem('user', JSON.stringify(response.data))
          
          message.value = 'Sign in successful! Redirecting...'
          
          // Redirect to home
          setTimeout(() => router.push('/'), 1000)
          
        } catch (err) {
          console.error('Auth callback error:', err)
          console.error('Error response:', err.response)
          
          error.value = err.response?.data?.message || err.message || 'Unknown error'
          message.value = 'Sign in failed'
          
          // Clear invalid token
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          
          setTimeout(() => router.push('/login'), 3000)
        }
      } else {
        // No token provided
        message.value = 'Invalid authentication'
        error.value = 'No token received from server'
        setTimeout(() => router.push('/login'), 3000)
      }
    })

    return { message, error }
  }
}
</script>

<style scoped>
.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>