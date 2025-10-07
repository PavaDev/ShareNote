<template>
  <nav class="bg-white shadow-lg sticky top-0 z-40">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center h-16">
        <!-- Brand + Links (left) -->
        <div class="flex items-center space-x-8">
          <router-link to="/" class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-boldim"><img src="/public/WhiteLogo.svg" alt="Italian Trulli"></div>
            <span class="font-bold text-xl text-gray-800">ShareNote</span>
          </router-link>

          <!-- ลิงก์ซ้าย: Home / Profile / Favorites -->
           <div class="hidden md:flex space-x-6">
            <template v-if="!isAdmin">
              <router-link to="/" class="text-gray-600 hover:text-primary-600 font-medium transition-colors">Home</router-link>
              <router-link to="/profile" class="text-gray-600 hover:text-primary-600 font-medium transition-colors">Profile</router-link>
              <router-link to="/favorites" class="text-gray-600 hover:text-primary-600 font-medium transition-colors">Favorites</router-link>
            </template>
            <template v-else>
              <router-link to="/" class="text-gray-600 hover:text-primary-600 font-medium transition-colors">Home</router-link>
              <div class="justify-end align-end">
                <router-link to="/admin" class="text-gray-600 hover:text-primary-600 font-medium">Admin Panel</router-link>
              </div>
            </template>
          </div>
        </div>

        <!-- Right side -->
        <div class="flex space-x-4">

          <!-- Not signed in -->
          <div v-if="!isAuthed" class="flex items-center gap-2">
            <router-link to="/login" class="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800">Login</router-link>
            <router-link to="/register" class="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white">Sign up</router-link>
          </div>

          <!-- Signed in -->
          <div v-else class="relative" ref="dropdownRef">
            <button
              @click="showDropdown = !showDropdown"
              class="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
              aria-haspopup="menu"
              :aria-expanded="showDropdown ? 'true' : 'false'"
            >
              <img
                :src="avatarSrc"
                @error="onAvatarError"
                class="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
                alt="avatar"
              />
              <span class="font-medium max-w-[140px] truncate">{{ displayName }}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown: เอา Profile/Favorites ออก เหลือ Settings + Logout -->
            <div
              v-if="showDropdown"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-100"
              role="menu"
            >
              <div class="px-4 py-2">
                <div class="text-sm font-medium text-gray-900 truncate">{{ displayName }}</div>
                <div class="text-xs text-gray-500 truncate">{{ currentUser?.email }}</div>
              </div>
              <hr class="my-2" />
              <router-link
                to="/settings"
                @click="showDropdown = false"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                Settings
              </router-link>
              <button
                @click="logout"
                class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                role="menuitem"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'

// ใช้ default ที่โฟลเดอร์ public ตามที่ขอ
const DEFAULT_AVATAR = '/public/default-avatar.svg'

export default {
  setup() {
    const store = useStore()
    const showDropdown = ref(false)
    const dropdownRef = ref(null)

    const currentUser = computed(() => store.getters['auth/currentUser'])
    const isAdmin = computed(() => store.getters['auth/isAdmin'])
    const isAuthed = computed(() => !!store.state.auth?.token || !!currentUser.value)

    const avatarSrc = computed(() => {
      const u = currentUser.value
      const raw = u?.profile?.profilePicture || u?.profilePicture || u?.avatarUrl || null
      if (!raw) return DEFAULT_AVATAR
      const ver = u?.updatedAt || Date.now()
      return `${raw}${raw.includes('?') ? '&' : '?'}v=${ver}`
    })

    const displayName = computed(() =>
      currentUser.value?.profile?.name ||
      currentUser.value?.name ||
      currentUser.value?.username ||
      (currentUser.value?.email ? currentUser.value.email.split('@')[0] : 'User')
    )

    const logout = () => {
      showDropdown.value = false
      store.dispatch('auth/logout')
    }
    const handleClickOutside = (e) => {
      if (dropdownRef.value && !dropdownRef.value.contains(e.target)) showDropdown.value = false
    }
    const onAvatarError = (e) => { e.target.src = `${DEFAULT_AVATAR}?v=${Date.now()}` }

    
    onUnmounted(() => document.removeEventListener('click', handleClickOutside))

    return { currentUser, isAdmin, isAuthed, avatarSrc, displayName, showDropdown, dropdownRef, logout, onAvatarError }
  }
}
</script>
