<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
      <p class="mt-4 text-gray-600">Completing sign in...</p>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    
    onMounted(() => {
      const token = route.query.token
      
      if (token) {
        // Parse JWT to get user info
        const payload = JSON.parse(atob(token.split('.')[1]))
        
        store.commit('auth/SET_AUTH', {
          token,
          user: {
            email: payload.sub,
            role: payload.role
          }
        })
        
        if (payload.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/')
        }
      } else {
        router.push('/login')
      }
    })
  }
}
</script>