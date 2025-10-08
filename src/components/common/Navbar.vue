<template>
  <nav class="bg-white shadow-lg sticky top-0 z-40">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center h-16">
        <!-- Brand -->
        <div class="flex items-center space-x-8">
          <router-link to="/" class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <img src="/public/WhiteLogo.svg" alt="Logo" />
            </div>
            <span class="font-bold text-xl text-gray-800">ShareNote</span>
          </router-link>

          <!-- Desktop links -->
          <div class="hidden md:flex space-x-6">
            <template v-if="!isAdmin">
              <router-link to="/" class="text-gray-600 hover:text-primary-600 font-medium">Home</router-link>
              <router-link to="/profile" class="text-gray-600 hover:text-primary-600 font-medium">Profile</router-link>
              <router-link to="/favorites" class="text-gray-600 hover:text-primary-600 font-medium">Favorites</router-link>
            </template>
            <template v-else>
              <router-link to="/" class="text-gray-600 hover:text-primary-600 font-medium">Home</router-link>
              <router-link to="/admin" class="text-gray-600 hover:text-primary-600 font-medium">Admin Panel</router-link>
            </template>
          </div>
        </div>

        <!-- Right side -->
        <div class="flex items-center space-x-4" ref="dropdownRef">
          <div v-if="!isAuthed" class="flex items-center gap-2">
            <router-link to="/login" class="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800">Login</router-link>
            <router-link to="/register" class="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white">Sign up</router-link>
          </div>

          <!-- Signed in -->
          <div v-else class="relative">
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

            <!-- Dropdown -->
            <div
              v-if="showDropdown"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-100"
              role="menu"
            >
              <div class="px-4 py-2 border-b border-gray-100">
                <div class="text-sm font-medium text-gray-900 truncate">{{ displayName }}</div>
                <div class="text-xs text-gray-500 truncate">{{ currentUser?.email }}</div>
              </div>

              <!-- Show Home/Profile/Favorites in dropdown only on mobile -->
              <div class="md:hidden">
                <template v-if="!isAdmin">
                  <router-link to="/" class="block px-4 py-2 text-gray-700 hover:bg-gray-100" @click="showDropdown = false">Home</router-link>
                  <router-link to="/profile" class="block px-4 py-2 text-gray-700 hover:bg-gray-100" @click="showDropdown = false">Profile</router-link>
                  <router-link to="/favorites" class="block px-4 py-2 text-gray-700 hover:bg-gray-100" @click="showDropdown = false">Favorites</router-link>
                </template>
                <template v-else>
                  <router-link to="/admin" class="block px-4 py-2 text-gray-700 hover:bg-gray-100" @click="showDropdown = false">Admin Panel</router-link>
                </template>
                <hr class="my-2" />
              </div>

              <!-- Common dropdown items -->
              <router-link
                to="/settings"
                @click="showDropdown = false"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Settings
              </router-link>
              <button
                @click="logout"
                class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'

const DEFAULT_AVATAR = '/public/default-avatar.svg'
const FALLBACK_DEFAULT = '/default-avatar.svg'

export default {
  setup() {
    const store = useStore()
    const showDropdown = ref(false)
    const dropdownRef = ref(null)

    const currentUser = computed(() => store.getters['auth/currentUser'])
    const isAdmin = computed(() => store.getters['auth/isAdmin'])
    const isAuthed = computed(() => !!store.state.auth?.token || !!currentUser.value)

    // ---- avatar prefetch state ----
    const avatarBlob = ref(null)       // blob: URL if prefetched
    let lastAvatarSource = null

    // fetch with ngrok header; return object URL or null
    const fetchFileWithHeaders = async (url) => {
      try {
        const res = await fetch(url, { headers: { 'ngrok-skip-browser-warning': 'true' } })
        if (!res.ok) throw new Error(`Failed (${res.status})`)
        const blob = await res.blob()
        return URL.createObjectURL(blob)
      } catch (e) {
        return null
      }
    }

    // fallback plain fetch
    const fetchFileWithoutHeaders = async (url) => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Failed (${res.status})`)
        const blob = await res.blob()
        return URL.createObjectURL(blob)
      } catch (e) {
        return null
      }
    }

    const revokeBlob = (u) => {
      try { if (u && String(u).startsWith('blob:')) URL.revokeObjectURL(u) } catch (e) {}
    }

    // watch the currentUser avatar fields and prefetch
    watch(
      () => ({
        profilePic: currentUser.value?.profile?.profilePicture,
        profilePicAlt: currentUser.value?.profilePicture,
        avatarUrlField: currentUser.value?.avatarUrl,
        updatedAt: currentUser.value?.updatedAt
      }),
      async (val) => {
        // cleanup old blob
        if (avatarBlob.value) { revokeBlob(avatarBlob.value); avatarBlob.value = null }
        lastAvatarSource = null

        // find first available raw URL
        const raw = val.profilePic || val.profilePicAlt || val.avatarUrlField || null
        if (!raw) return

        const ver = val.updatedAt || Date.now()
        const url = `${raw}${String(raw).includes('?') ? '&' : '?'}v=${ver}`

        if (lastAvatarSource === url && avatarBlob.value) return

        // try with header first (for ngrok)
        let obj = await fetchFileWithHeaders(url)
        if (!obj) {
          obj = await fetchFileWithoutHeaders(url)
        }

        if (obj) {
          avatarBlob.value = obj
          lastAvatarSource = url
        } else {
          avatarBlob.value = null
        }
      },
      { immediate: true }
    )

    // computed avatar src used in template
    const avatarSrc = computed(() => avatarBlob.value || DEFAULT_AVATAR)

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

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      // revoke blob on unmount
      if (avatarBlob.value) { revokeBlob(avatarBlob.value); avatarBlob.value = null }
    })

    const onAvatarError = (e) => { e.target.src = `${FALLBACK_DEFAULT}?v=${Date.now()}` }

    return { currentUser, isAdmin, isAuthed, avatarSrc, displayName, showDropdown, dropdownRef, logout, onAvatarError }
  }
}
</script>
