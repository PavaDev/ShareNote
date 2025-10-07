<template>
  <div id="app" class="min-h-screen bg-emerald-100">
    <Navbar v-if="!isAuthRoute" />
    <main class="container mx-auto px-4 py-8">
      <router-view v-slot="{ Component }" class="animate-fade-in">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <Toast />
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/common/Navbar.vue'
import Toast from './components/common/Toast.vue'

export default {
  name: 'App',
  components: {
    Navbar,
    Toast
  },
  setup() {
    const route = useRoute()
    const isAuthRoute = computed(() => {
      return ['/login', '/register'].includes(route.path)
    })
    
    return {
      isAuthRoute
    }
  }
}
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>