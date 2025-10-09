<template>
  <div class="min-h-screen bg-emerald-100 flex items-center justify-center px-4">
    <div class="card max-w-md w-full p-8 animate-slide-up">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-emerald-500">
          Welcome Back
        </h1>
        <p class="text-yellow-500 mt-2">Sign in to ShareNote</p>
      </div>

      <!-- Suspension Error Alert -->
      <div v-if="suspensionError" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-red-800">Account Suspended</h3>
            <p class="text-sm text-red-700 mt-1">
              Your account has been suspended. Please contact support for assistance.
            </p>
            <div class="mt-3">
              <button 
                @click="showSupportModal = true" 
                class="text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Contact Support
              </button>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button @click="dismissSuspensionError" class="inline-flex text-red-400 hover:text-red-500">
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
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
          <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            v-model="form.password"
            type="password"
            required
            class="input-field"
            placeholder="••••••••"
          />
        </div>
        
        <div class="flex items-center justify-between">
          <button
            type="button"
            @click="showForgotPasswordModal = true"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Forgot password?
          </button>
        </div>
        
        <button
          type="submit"
          :disabled="loading"
          class="w-full btn btn-cta"
        >
          <span v-if="!loading">Sign In</span>
          <span v-else class="flex items-center justify-center">
            <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Signing in...
          </span>
        </button>
        
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        
        <button
          type="button"
          @click="loginWithGoogle"
          class="w-full btn bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <!-- <svg class="w-5 h-5 mr-2 inline" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg> -->
          Sign in with KKU SSO
        </button>
      </form>
      
      <p class="mt-8 text-center text-sm text-gray-600">
        Don't have an account?
        <router-link to="/register" class="font-medium text-emerald-400 hover:text-emerald-500">
          Sign up
        </router-link>
      </p>
    </div>

    <!-- Forgot Password Modal -->
    <div 
      v-if="showForgotPasswordModal" 
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      @click.self="showForgotPasswordModal = false"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-8 animate-slide-up shadow-2xl">
        <div class="text-center mb-6">
          <div class="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-100 to-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h3>
          <p class="text-gray-600 text-sm">
            Don't worry! Enter your email address and we'll send a reset request to our admin team.
          </p>
        </div>

        <form @submit.prevent="handleForgotPassword" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                v-model="forgotPasswordEmail"
                type="email"
                required
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex">
              <svg class="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm text-blue-800">
                An admin will review your request and reset your password. You'll receive an email with your new temporary password.
              </p>
            </div>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              @click="showForgotPasswordModal = false"
              class="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="forgotPasswordLoading"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-yellow-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-yellow-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:pointer-events-none shadow-lg"
            >
              <span v-if="!forgotPasswordLoading">Send Request</span>
              <span v-else class="flex items-center justify-center">
                <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Sending...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Support Modal -->
    <div 
      v-if="showSupportModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="showSupportModal = false"
    >
      <div class="bg-white rounded-lg max-w-md w-full p-6 animate-slide-up">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-bold text-gray-900">Contact Support</h3>
          <button 
            @click="showSupportModal = false" 
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Support Image/Illustration -->
        <div class="mb-6 text-center">
          <div class="mx-auto w-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
            <img src="/QR.jpg" alt="QR Code" class="w-full h-full object-contain">
          </div>
        </div>

        <!-- Additional Info -->
        <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex">
            <svg class="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm text-yellow-800">
              <strong>You need to pay me at least 10,000 baht for unlock your account.</strong>
            </p>
          </div>
        </div>

        <!-- Close Button -->
        <div class="mt-6 flex justify-end">
          <button 
            @click="showSupportModal = false"
            class="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'

export default {
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const loading = ref(false)
    const suspensionError = ref(false)
    const showSupportModal = ref(false)
    const showForgotPasswordModal = ref(false)
    const forgotPasswordEmail = ref('')
    const forgotPasswordLoading = ref(false)
    const form = ref({
      email: '',
      password: ''
    })

    // Check for suspension error on mount
    onMounted(() => {
      const errorCode = route.query.code
      if (errorCode === 'account_suspended') {
        suspensionError.value = true
        // Clean up URL without page reload
        router.replace({ query: {} })
      }
    })

    const dismissSuspensionError = () => {
      suspensionError.value = false
    }

    const openLiveChat = () => {
      // Implement your live chat integration here
      // For example: Intercom, Zendesk, Tawk.to, etc.
      store.dispatch('ui/showToast', {
        message: 'Live chat opening...',
        type: 'info'
      })
      // window.Intercom('show') // Example for Intercom
    }
    
    const handleLogin = async () => {
      loading.value = true
      try {
        await store.dispatch('auth/login', form.value)
      } catch (error) {
        // Check if error is due to suspension
        if (error.includes('suspended') || error.includes('Suspended')) {
          suspensionError.value = true
        }
        store.dispatch('ui/showToast', {
          message: error,
          type: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    const loginWithGoogle = () => {
      window.location.href = 'https://prolific-recreation-production.up.railway.app/api/oauth2/authorization/google'
    }
    
    const handleForgotPassword = async () => {
      if (!forgotPasswordEmail.value) return
      
      forgotPasswordLoading.value = true
      try {
        await api.post('/auth/forgot-password', { email: forgotPasswordEmail.value })
        store.dispatch('ui/showToast', {
          message: 'Password reset request sent to admin successfully!',
          type: 'success'
        })
        showForgotPasswordModal.value = false
        forgotPasswordEmail.value = ''
      } catch (error) {
        store.dispatch('ui/showToast', {
          message: 'Failed to send reset request. Please try again.',
          type: 'error'
        })
      } finally {
        forgotPasswordLoading.value = false
      }
    }
    
    return {
      form,
      loading,
      suspensionError,
      showSupportModal,
      showForgotPasswordModal,
      forgotPasswordEmail,
      forgotPasswordLoading,
      dismissSuspensionError,
      openLiveChat,
      handleLogin,
      loginWithGoogle,
      handleForgotPassword
    }
  }
}
</script>