<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-8">
    <div class="card max-w-md w-full p-8 animate-slide-up">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
          Create Account
        </h1>
        <p class="text-gray-600 mt-2">Join ShareNote today</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <input
            v-model="form.username"
            type="text"
            required
            class="input-field"
            placeholder="johndoe"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="input-field"
            placeholder="you@example.com"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            v-model="form.name"
            type="text"
            required
            class="input-field"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            v-model="form.password"
            type="password"
            required
            minlength="6"
            class="input-field"
            placeholder="At least 6 characters"
          />
        </div>
        
        <button
          type="submit"
          :disabled="loading"
          class="w-full btn btn-cta"
        >
          <span v-if="!loading">Sign Up</span>
          <span v-else>Creating account...</span>
        </button>
      </form>
      
      <p class="mt-8 text-center text-sm text-gray-600">
        Already have an account?
        <router-link to="/login" class="font-medium text-emerald-600 hover:text-emerald-700">
          Sign in
        </router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useStore } from 'vuex'

export default {
  setup() {
    const store = useStore()
    const loading = ref(false)
    const form = ref({
      username: '',
      email: '',
      name: '',
      password: '',
      profilePicture: null
    })
    
    const handleRegister = async () => {
      loading.value = true
      try {
        await store.dispatch('auth/register', form.value)
      } catch (error) {
        store.dispatch('ui/showToast', {
          message: error,
          type: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    return {
      form,
      loading,
      handleRegister
    }
  }
}
</script>