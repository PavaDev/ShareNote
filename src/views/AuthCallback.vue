<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="loading-spinner mb-4"></div>
      <p class="text-gray-600">{{ message }}</p>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()
    const message = ref('Completing sign in...')

    onMounted(async () => {
      const token = route.query.token
      const code = route.query.code

      // Handle suspended account
      if (code === 'account_suspended') {
        message.value = 'Account suspended'
        store.dispatch('ui/showToast', {
          message: 'Your account has been suspended. Please contact support.',
          type: 'error'
        })
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      // Handle successful login
      if (token) {
        try {
          // Store token
          localStorage.setItem('token', token)
          
          // Fetch user data
          const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const userData = await response.json()
            
            // Store user in Vuex
            store.commit('auth/SET_AUTH', {
              token,
              user: userData
            })
            
            // Store in localStorage for persistence
            localStorage.setItem('user', JSON.stringify(userData))
            
            message.value = 'Sign in successful! Redirecting...'
            
            // Redirect to home
            setTimeout(() => router.push('/'), 1000)
          } else {
            throw new Error('Failed to fetch user data')
          }
        } catch (error) {
          console.error('Auth callback error:', error)
          message.value = 'Sign in failed'
          store.dispatch('ui/showToast', {
            message: 'Failed to complete sign in. Please try again.',
            type: 'error'
          })
          setTimeout(() => router.push('/login'), 2000)
        }
      } else {
        // No token provided
        message.value = 'Invalid authentication'
        setTimeout(() => router.push('/login'), 2000)
      }
    })

    return { message }
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