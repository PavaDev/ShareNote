<template>
  <div class="max-w-7xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-800 mb-8">Admin Panel</h1>

    <!-- Password Reset Requests -->
    <div v-if="passwordResetRequests.length > 0" class="card p-6 mb-8 border-yellow-400">
      <h2 class="text-xl font-semibold mb-4 text-yellow-600">Password Reset Requests</h2>
      <div class="space-y-3">
        <div
          v-for="u in passwordResetRequests"
          :key="u.id"
          class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <img
              :src="avatarFor(u)"
              @error="onAvatarError"
              class="w-10 h-10 rounded-full ring-1 ring-gray-200 object-cover"
              alt="avatar"
            />
            <div>
              <p class="font-medium">{{ displayName(u) }}</p>
              <p class="text-sm text-gray-600">{{ u.email }}</p>
            </div>
          </div>
          <button @click="openResetPasswordModal(u.id)" class="btn btn-primary text-sm">
            Reset Password
          </button>
        </div>
      </div>
    </div>

    <!-- Users List -->
    <div class="card p-6">
      <h2 class="text-xl font-semibold mb-4">Users Management</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <img
                    :src="avatarFor(u)"
                    @error="onAvatarError"
                    class="w-10 h-10 rounded-full mr-3 ring-1 ring-gray-200 object-cover"
                    alt="avatar"
                  />
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ displayName(u) }}
                    </div>
                    <div class="text-sm text-gray-500">@{{ u.username }}</div>
                  </div>
                </div>
              </td>

              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ u.email }}
              </td>

              <td class="px-4 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-gray-500">
                  {{ getProvider(u) }}
                </span>
              </td>

              <td class="px-4 py-4 whitespace-nowrap">
                <span
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="u.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-yellow-100 text-yellow-800'"
                >
                  {{ u.role }}
                </span>
              </td>

              <td class="px-4 py-4 whitespace-nowrap">
                <span v-if="u.isSuspended" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Suspended</span>
                <span v-else class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
              </td>

              <td class="px-4 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center space-x-2">
                  <!-- View Button -->
                  <button
                    @click="viewUserDetails(u)"
                    class="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  <!-- Hide suspend/unsuspend for ADMIN -->
                  <template v-if="u.role !== 'ADMIN'">
                    <button
                      v-if="u.isSuspended"
                      :disabled="busy[u.id]"
                      @click="unsuspendUser(u)"
                      class="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      title="Unsuspend User"
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>

                    <button
                      v-else
                      :disabled="busy[u.id]"
                      @click="suspendUser(u)"
                      class="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      title="Suspend User"
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div 
      v-if="showResetPasswordModal" 
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      @click.self="closeResetPasswordModal"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-8 animate-slide-up shadow-2xl">
        <div class="text-center mb-6">
          <div class="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Reset User Password</h3>
          <p class="text-gray-600 text-sm">Enter a new password or leave empty for auto-generation</p>
        </div>

        <form @submit.prevent="handleResetPassword" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">New Password (Optional)</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 012-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                v-model="resetPasswordForm.newPassword"
                type="text"
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Leave empty for auto-generation"
              />
            </div>
          </div>

          <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div class="flex">
              <svg class="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="text-sm text-indigo-800">
                <p class="font-semibold mb-1">Auto-Generation</p>
                <p>If you leave the field empty, a secure temporary password will be automatically generated and displayed after reset.</p>
              </div>
            </div>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              @click="closeResetPasswordModal"
              class="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="resetPasswordLoading"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:pointer-events-none shadow-lg"
            >
              <span v-if="!resetPasswordLoading">Reset Password</span>
              <span v-else class="flex items-center justify-center">
                <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Resetting...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success Modal for Temporary Password -->
    <div 
      v-if="showTempPasswordModal" 
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      @click.self="showTempPasswordModal = false"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-8 animate-slide-up shadow-2xl">
        <div class="text-center mb-6">
          <div class="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h3>
          <p class="text-gray-600 text-sm">The new temporary password has been generated</p>
        </div>

        <div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-5">
          <label class="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Temporary Password</label>
          <div class="flex items-center justify-between">
            <code class="text-2xl font-mono font-bold text-gray-900">{{ temporaryPassword }}</code>
            <button 
              @click="copyPassword"
              class="ml-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-5">
          <div class="flex">
            <svg class="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-sm text-yellow-800">
              <strong>Important:</strong> Make sure to save this password and share it securely with the user. This will not be shown again.
            </p>
          </div>
        </div>

        <button
          @click="showTempPasswordModal = false"
          class="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
        >
          Got it!
        </button>
      </div>
    </div>

    <!-- User Details Modal -->
    <div
      v-if="selectedUser"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
    >
      <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-4">
            <img :src="avatarFor(selectedUser)" @error="onAvatarError" class="w-16 h-16 rounded-full object-cover" />
            <div>
              <h3 class="text-2xl font-semibold">User Details</h3>
              <p class="text-gray-600">{{ displayName(selectedUser) }} (@{{ selectedUser.username }})</p>
            </div>
          </div>
          <button @click="selectedUser = null" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="mb-6">
          <h4 class="font-semibold mb-3">User Information</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><span class="text-gray-600">Email:</span> {{ selectedUser.email }}</div>
            <div><span class="text-gray-600">Role:</span> {{ selectedUser.role }}</div>
            <div><span class="text-gray-600">Provider:</span> {{ getProvider(selectedUser) }}</div>
            <div>
              <span class="text-gray-600">Status:</span>
              <span :class="selectedUser.isSuspended ? 'text-red-600' : 'text-green-600'">
                {{ selectedUser.isSuspended ? 'Suspended' : 'Active' }}
              </span>
            </div>
            <div><span class="text-gray-600">Joined:</span> {{ formatDate(selectedUser.createdAt) }}</div>
          </div>
        </div>

        <div v-if="userNotes.length > 0">
          <h4 class="font-semibold mb-3">User's Notes</h4>
          <div class="space-y-3">
            <div v-for="n in userNotes" :key="n.id" class="border rounded-lg p-4">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h5 class="font-medium">{{ n.title }}</h5>
                  <p class="text-sm text-gray-600 mt-1">{{ (n.content || '').slice(0, 100) }}...</p>
                  <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{{ n.isPublic ? 'Public' : 'Private' }}</span>
                    <span>{{ n.likeCount }} likes</span>
                    <span>{{ n.commentCount }} comments</span>
                  </div>
                </div>
                <button @click="deleteUserNote(n.id)" class="text-red-600 hover:text-red-800 ml-4">Delete</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import api from '../services/api'

const PRIMARY_DEFAULT = '/public/default-avatar.svg'
const FALLBACK_DEFAULT = '/default-avatar.svg'

export default {
  setup () {
    const store = useStore()
    const users = ref([])
    const passwordResetRequests = ref([])
    const selectedUser = ref(null)
    const userNotes = ref([])
    const busy = ref({})
    const showResetPasswordModal = ref(false)
    const showTempPasswordModal = ref(false)
    const resetPasswordForm = ref({ userId: null, newPassword: '' })
    const resetPasswordLoading = ref(false)
    const temporaryPassword = ref('')

    // ---- avatar prefetch caches ----
    // avatarMap: { [userId]: blobUrl }
    const avatarMap = ref({})
    // sourceMap: Map(userId -> originalSourceUrlWithVer) used to skip refetching
    const sourceMap = new Map()

    // --- utility fetchers ---
    const fetchFileWithHeaders = async (url) => {
      try {
        const response = await fetch(url, { headers: { 'ngrok-skip-browser-warning': 'true' } })
        if (!response.ok) throw new Error(`Failed (${response.status})`)
        const blob = await response.blob()
        return URL.createObjectURL(blob)
      } catch (e) {
        return null
      }
    }

    const fetchFileWithoutHeaders = async (url) => {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed (${response.status})`)
        const blob = await response.blob()
        return URL.createObjectURL(blob)
      } catch (e) {
        return null
      }
    }

    const revokeBlobIfNeeded = (u) => {
      try { if (u && String(u).startsWith('blob:')) URL.revokeObjectURL(u) } catch (e) {}
    }

    // build canonical avatar source url (with version param)
    const avatarSourceFor = (u) => {
      const raw = u?.profile?.profilePicture || u?.profilePicture || u?.avatarUrl || null
      if (!raw) return null
      const ver = u?.updatedAt || Date.now()
      return `${raw}${String(raw).includes('?') ? '&' : '?'}v=${ver}`
    }

    // prefetch avatar for a single user (caches blob in avatarMap)
    const prefetchAvatarFor = async (u) => {
      if (!u || !u.id) return
      const id = String(u.id)
      const src = avatarSourceFor(u)
      // if no raw -> clear any existing quickly and skip
      if (!src) {
        if (avatarMap.value[id]) { revokeBlobIfNeeded(avatarMap.value[id]); delete avatarMap.value[id] }
        sourceMap.delete(id)
        return
      }
      // skip if same
      if (sourceMap.get(id) === src && avatarMap.value[id]) return

      // revoke existing before replacing
      if (avatarMap.value[id]) { revokeBlobIfNeeded(avatarMap.value[id]); delete avatarMap.value[id] }

      // try with header first (ngrok)
      let obj = await fetchFileWithHeaders(src)
      if (!obj) {
        // fallback without header
        obj = await fetchFileWithoutHeaders(src)
      }
      if (obj) {
        avatarMap.value = { ...avatarMap.value, [id]: obj }
        sourceMap.set(id, src)
      } else {
        // keep no blob; it will fallback to PRIMARY_DEFAULT when rendering
        sourceMap.delete(id)
      }
    }

    // prefetch avatars for array of users (cleans up removed)
    const prefetchAvatarsForList = async (list) => {
      const ids = new Set((list || []).map(u => String(u.id)))
      // revoke blobs for users not present anymore
      for (const key of Object.keys(avatarMap.value)) {
        if (!ids.has(key)) {
          revokeBlobIfNeeded(avatarMap.value[key])
          delete avatarMap.value[key]
          sourceMap.delete(key)
        }
      }
      // fetch missing
      for (const u of list || []) {
        prefetchAvatarFor(u) // don't await serially to speed up; each call will run their own fetches
      }
    }

    // call fetchUsers and prefetch avatars when done
    const fetchUsers = async () => {
      try {
        const { data } = await api.get(`/admin/users?t=${Date.now()}`)
        // normalize as before; keep original normalizeUserList behavior inline
        const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []
        const normalized = list.map(u => {
          const isSuspended =
            (u.is_suspended !== undefined ? u.is_suspended : undefined) ??
            (u.isSuspended !== undefined ? u.isSuspended : undefined) ??
            (u.suspended !== undefined ? u.suspended : undefined) ??
            false
          const role =
            typeof u.role === 'string'
              ? u.role
              : (u.role && u.role.name) ? u.role.name : 'USER'

          return {
            ...u,
            isSuspended: Boolean(isSuspended),
            role,
            updatedAt: u.updatedAt || u.lastModifiedDate || u.updated_at || null
          }
        })
        users.value = normalized
        // prefetch avatars for the list
        prefetchAvatarsForList(users.value)
      } catch (e) {
        store.dispatch('ui/showToast', { message: 'Failed to load users', type: 'error' })
      }
    }

    const fetchPasswordResetRequests = async () => {
      try {
        const { data } = await api.get(`/admin/password-reset-requests?t=${Date.now()}`)
        const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []
        const normalized = list.map(u => {
          const isSuspended =
            (u.is_suspended !== undefined ? u.is_suspended : undefined) ??
            (u.isSuspended !== undefined ? u.isSuspended : undefined) ??
            (u.suspended !== undefined ? u.suspended : undefined) ??
            false
          const role =
            typeof u.role === 'string'
              ? u.role
              : (u.role && u.role.name) ? u.role.name : 'USER'

          return {
            ...u,
            isSuspended: Boolean(isSuspended),
            role,
            updatedAt: u.updatedAt || u.lastModifiedDate || u.updated_at || null
          }
        })
        passwordResetRequests.value = normalized
        // prefetch their avatars too
        prefetchAvatarsForList(passwordResetRequests.value)
      } catch (e) {
        // ignore
      }
    }

    // view user details and prefetch selected user's avatar
    const viewUserDetails = async (user) => {
      selectedUser.value = user
      // prefetch avatar for selected user if not already
      prefetchAvatarFor(user)

      try {
        const { data } = await api.get(`/notes/user/${user.id}?t=${Date.now()}`)
        const list = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : [])
        userNotes.value = list
      } catch {
        userNotes.value = []
      }
    }

    // patchUser, suspend/unsuspend, reset password logic remains same - after changes we may prefetch again
    const patchUser = (partial) => {
      if (!partial) return
      const u = partial
      const isSuspended =
        (u.is_suspended !== undefined ? u.is_suspended : undefined) ??
        (u.isSuspended !== undefined ? u.isSuspended : undefined) ??
        (u.suspended !== undefined ? u.suspended : undefined) ??
        false
      const role = typeof u.role === 'string' ? u.role : (u.role && u.role.name) ? u.role.name : 'USER'
      const updated = { ...u, isSuspended: Boolean(isSuspended), role, updatedAt: u.updatedAt || u.lastModifiedDate || u.updated_at || null }

      const idx = users.value.findIndex(x => String(x.id) === String(updated.id))
      if (idx > -1) users.value[idx] = { ...users.value[idx], ...updated }
      if (selectedUser.value && String(selectedUser.value.id) === String(updated.id)) {
        selectedUser.value = { ...selectedUser.value, ...updated }
      }
      // prefetch new avatar if provided
      prefetchAvatarFor(updated)
    }

    const suspendUser = async (user) => {
      if (busy.value[user.id]) return
      busy.value[user.id] = true
      const prev = !!user.isSuspended
      user.isSuspended = true
      if (selectedUser.value?.id === user.id) selectedUser.value.isSuspended = true
      try {
        const res = await api.put(`/admin/users/${user.id}/suspend`)
        if (res?.data) patchUser(res.data); else await fetchUsers()
        store.dispatch('ui/showToast', { message: 'User suspended successfully', type: 'success' })
      } catch (e) {
        user.isSuspended = prev
        if (selectedUser.value?.id === user.id) selectedUser.value.isSuspended = prev
        store.dispatch('ui/showToast', { message: 'Failed to suspend user', type: 'error' })
      } finally {
        busy.value[user.id] = false
      }
    }

    const unsuspendUser = async (user) => {
      if (busy.value[user.id]) return
      busy.value[user.id] = true
      const prev = !!user.isSuspended
      user.isSuspended = false
      if (selectedUser.value?.id === user.id) selectedUser.value.isSuspended = false
      try {
        const res = await api.put(`/admin/users/${user.id}/unsuspend`)
        if (res?.data) patchUser(res.data); else await fetchUsers()
        store.dispatch('ui/showToast', { message: 'User unsuspended successfully', type: 'success' })
      } catch (e) {
        user.isSuspended = prev
        if (selectedUser.value?.id === user.id) selectedUser.value.isSuspended = prev
        store.dispatch('ui/showToast', { message: 'Failed to unsuspend user', type: 'error' })
      } finally {
        busy.value[user.id] = false
      }
    }

    const openResetPasswordModal = (userId) => {
      resetPasswordForm.value.userId = userId
      resetPasswordForm.value.newPassword = ''
      showResetPasswordModal.value = true
    }

    const closeResetPasswordModal = () => {
      showResetPasswordModal.value = false
      resetPasswordForm.value = { userId: null, newPassword: '' }
    }

    const handleResetPassword = async () => {
      if (!resetPasswordForm.value.userId) return
      resetPasswordLoading.value = true
      try {
        const { data } = await api.put(`/admin/users/${resetPasswordForm.value.userId}/reset-password`, {
          newPassword: resetPasswordForm.value.newPassword || null
        })
        temporaryPassword.value = data?.temporaryPassword || resetPasswordForm.value.newPassword || '(auto-generated)'
        store.dispatch('ui/showToast', { message: 'Password reset successfully', type: 'success' })
        showResetPasswordModal.value = false
        showTempPasswordModal.value = true
        fetchPasswordResetRequests()
      } catch (error) {
        store.dispatch('ui/showToast', { message: 'Failed to reset password', type: 'error' })
      } finally {
        resetPasswordLoading.value = false
      }
    }

    const copyPassword = () => {
      navigator.clipboard.writeText(temporaryPassword.value)
      store.dispatch('ui/showToast', { message: 'Password copied to clipboard!', type: 'success' })
    }

    const deleteUserNote = async (noteId) => {
      if (!confirm('Are you sure you want to delete this note?')) return
      try {
        await api.delete(`/admin/notes/${noteId}`)
        store.dispatch('ui/showToast', { message: 'Note deleted successfully', type: 'success' })
        userNotes.value = userNotes.value.filter(n => String(n.id) !== String(noteId))
      } catch {
        store.dispatch('ui/showToast', { message: 'Failed to delete note', type: 'error' })
      }
    }

    // avatarFor: returns prefetched blob URL if present, else original url (with ?v=) or fallback
    const avatarFor = (u) => {
      if (!u) return PRIMARY_DEFAULT
      const id = String(u.id || u._id || u.username || Math.random())
      if (avatarMap.value[id]) return avatarMap.value[id]
      const raw = u?.profile?.profilePicture || u?.profilePicture || u?.avatarUrl || null
      if (!raw) return PRIMARY_DEFAULT
      const ver = u?.updatedAt || Date.now()
      return `${raw}${String(raw).includes('?') ? '&' : '?'}v=${ver}`
    }

    const onAvatarError = (e) => { e.target.src = `${FALLBACK_DEFAULT}?v=${Date.now()}` }
    const displayName = (u) => u?.profile?.name || u?.name || u?.username || 'Unknown'
    const formatDate = (iso) => { try { return new Date(iso).toLocaleDateString() } catch { return '' } }
    const getProvider = (u) => u?.profile?.provider || u?.provider || 'LOCAL'

    onMounted(() => {
      fetchUsers()
      fetchPasswordResetRequests()
    })

    // Watch users & passwordResetRequests arrays; keep avatar cache in-sync
    watch(users, (val) => { prefetchAvatarsForList(val) }, { immediate: false })
    watch(passwordResetRequests, (val) => { prefetchAvatarsForList(val) }, { immediate: false })

    // Cleanup all blob URLs on unmount
    onUnmounted(() => {
      for (const key of Object.keys(avatarMap.value)) {
        revokeBlobIfNeeded(avatarMap.value[key])
        delete avatarMap.value[key]
      }
      sourceMap.clear()
    })

    return {
      users,
      passwordResetRequests,
      selectedUser,
      userNotes,
      busy,
      showResetPasswordModal,
      showTempPasswordModal,
      resetPasswordForm,
      resetPasswordLoading,
      temporaryPassword,
      getProvider,
      viewUserDetails,
      suspendUser,
      unsuspendUser,
      openResetPasswordModal,
      closeResetPasswordModal,
      handleResetPassword,
      copyPassword,
      deleteUserNote,
      avatarFor,
      onAvatarError,
      displayName,
      formatDate
    }
  }
}
</script>

<style scoped>
/* optional small animation used in your markup */
@keyframes slide-up {
  from { transform: translateY(10px); opacity: 0 }
  to { transform: translateY(0); opacity: 1 }
}
.animate-slide-up { animation: slide-up .18s ease-out; }
</style>
