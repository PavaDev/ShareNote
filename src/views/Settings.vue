<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-800 mb-8">Settings</h1>

    <!-- Profile -->
    <div class="card p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Profile Information</h2>

      <!-- avatar preview + actions -->
      <div class="flex items-center gap-4 mb-4">
        <img
          :src="currentAvatarUrl"
          @error="onAvatarError"
          class="w-16 h-16 rounded-full ring-1 ring-gray-200 object-cover"
          alt="avatar"
        />
        <div class="flex flex-wrap gap-2">
          <button class="btn btn-secondary" @click="openCropper">Upload & Crop</button>
          <button class="btn btn-light" @click="removePicture">Remove</button>
        </div>
      </div>

      <form @submit.prevent="updateProfile" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input v-model="profileForm.name" type="text" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea v-model="profileForm.bio" class="input-field h-32 resize-none"></textarea>
        </div>
        <p class="text-xs text-gray-500 -mt-2">
          * รูปโปรไฟล์จะถูกครอปเป็นอัตราส่วน 1:1 ขนาด 512×512
        </p>
        <button type="submit" class="btn btn-primary">Update Profile</button>
      </form>
    </div>

    <!-- Password (LOCAL เท่านั้น) -->
    <div v-if="isLocalProvider" class="card p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Change Password</h2>
      <form @submit.prevent="changePassword" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
          <input v-model="passwordForm.oldPassword" type="password" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <input v-model="passwordForm.newPassword" type="password" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
          <input v-model="passwordForm.confirmPassword" type="password" class="input-field" />
        </div>
        <button type="submit" class="btn btn-primary">Change Password</button>
      </form>
    </div>

    <!-- Danger -->
    <div class="card p-6 border-red-200">
      <h2 class="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
      <p class="text-gray-600 mb-4">Once you delete your account, there is no going back.</p>
      <div class="flex space-x-4">
        <button @click="logout" class="btn btn-secondary">Logout</button>
        <button @click="deleteAccount" class="btn btn-danger">Delete Account</button>
      </div>
    </div>

    <!-- Cropper Modal -->
    <AvatarCropper
      v-if="showCropper"
      :size="512"
      :quality="0.9"
      @done="onCropDone"
      @cancel="onCropCancel"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import api from '../services/api'
import AvatarCropper from '../views/AvatarCropper.vue'

const PRIMARY_DEFAULT = '/public/default-avatar.svg'
const FALLBACK_DEFAULT = '/default-avatar.svg'

export default {
  components: { AvatarCropper },
  setup () {
    const store = useStore()

    // provider: ใช้ตัดสินใจแสดง/ซ่อนส่วนเปลี่ยนรหัสผ่าน
    const provider = ref('LOCAL')
    const isLocalProvider = computed(() => (provider.value || 'LOCAL') === 'LOCAL')

    // ฟอร์มโปรไฟล์
    const profileForm = ref({ name: '', bio: '' })

    // avatar prefetch state
    const avatarBlob = ref(null)     // blob: URL when prefetched
    let lastAvatarSource = null     // to avoid refetching same URL unnecessarily

    // computed currentAvatarUrl used in template (blob or default)
    const currentAvatarUrl = computed(() => avatarBlob.value || `${PRIMARY_DEFAULT}`)

    const onAvatarError = (e) => { e.target.src = `${FALLBACK_DEFAULT}?v=${Date.now()}` }

    // modal cropper
    const showCropper = ref(false)
    const croppedFile = ref(null)

    // utility: fetch with ngrok header and return object URL or null
    const fetchFileWithHeaders = async (url) => {
      try {
        const response = await fetch(url, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        if (!response.ok) throw new Error(`Failed to fetch ${url} (${response.status})`)
        const blob = await response.blob()
        return URL.createObjectURL(blob)
      } catch (err) {
        return null
      }
    }

    // fallback fetch without headers
    const fetchFileWithoutHeaders = async (url) => {
      try {
        const resp = await fetch(url)
        if (!resp.ok) throw new Error(`Failed to fetch ${url} (${resp.status})`)
        const blob = await resp.blob()
        return URL.createObjectURL(blob)
      } catch (err) {
        return null
      }
    }

    const revokeBlobIfNeeded = (u) => {
      try { if (u && String(u).startsWith('blob:')) URL.revokeObjectURL(u) } catch (e) {}
    }

    // helper to prefetch avatar (url may be null/undefined)
    const prefetchAvatar = async (rawUrl, ver = Date.now()) => {
      // clean previous
      if (avatarBlob.value) { revokeBlobIfNeeded(avatarBlob.value); avatarBlob.value = null }
      lastAvatarSource = null

      if (!rawUrl) return

      const url = `${rawUrl}${String(rawUrl).includes('?') ? '&' : '?'}v=${ver}`

      if (lastAvatarSource === url && avatarBlob.value) return

      // try with ngrok header first
      let obj = await fetchFileWithHeaders(url)
      if (!obj) {
        // fallback without header
        obj = await fetchFileWithoutHeaders(url)
      }

      if (obj) {
        avatarBlob.value = obj
        lastAvatarSource = url
      } else {
        avatarBlob.value = null
      }
    }

    // โหลดข้อมูลโปรไฟล์ (รวม provider จาก backend)
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/profile/me')
        profileForm.value.name = data?.name || ''
        profileForm.value.bio = data?.bio || ''
        provider.value = data?.provider || 'LOCAL'

        // sync store user profile too
        const token = store.state.auth?.token || localStorage.getItem('token')
        const prev  = store.getters['auth/currentUser'] || {}
        store.commit('auth/SET_AUTH', {
          token,
          user: { ...prev, username: data?.username || prev.username, profile: data }
        })

        // prefetch avatar using returned profilePicture
        const base = data?.profilePicture || null
        const ver = data?.updatedAt || Date.now()
        await prefetchAvatar(base, ver)
      } catch (err) {
        store.dispatch('ui/showToast', { message: 'Failed to load profile', type: 'error' })
      }
    }

    onMounted(loadProfile)

    // watch store current user profile/fields and prefetch when changed externally
    watch(
      () => store.getters['auth/currentUser'],
      (u) => {
        const profile = u?.profile || null
        const raw = profile?.profilePicture || u?.profilePicture || u?.avatarUrl || null
        const ver = profile?.updatedAt || u?.updatedAt || Date.now()
        if (raw) prefetchAvatar(raw, ver)
      },
      { immediate: true }
    )

    // เปิด/ปิด cropper
    const openCropper = () => { showCropper.value = true }
    const onCropCancel = () => { showCropper.value = false; croppedFile.value = null }
    const onCropDone = async (file) => {
      showCropper.value = false
      croppedFile.value = file
      await uploadCroppedAvatar()
    }

    // อัปโหลดรูปที่ครอปแล้วทันที
    const uploadCroppedAvatar = async () => {
      try {
        if (!croppedFile.value) return
        const formData = new FormData()
        formData.append('profile', new Blob([JSON.stringify({
          name: profileForm.value.name,
          bio: profileForm.value.bio
        })], { type: 'application/json' }))
        formData.append('file', croppedFile.value)

        const { data: updated } = await api.put('/profile/me', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        // prefetch the new profile picture
        const base = updated?.profilePicture || null
        const ver = updated?.updatedAt || Date.now()
        await prefetchAvatar(base, ver)

        croppedFile.value = null

        // sync user in store
        const token = store.state.auth?.token || localStorage.getItem('token')
        const user = (store.getters['auth/currentUser']) || {}
        store.commit('auth/SET_AUTH', { token, user: { ...user, profile: updated } })

        store.dispatch('ui/showToast', { message: 'Profile picture updated', type: 'success' })
      } catch (err) {
        store.dispatch('ui/showToast', { message: 'Failed to update picture', type: 'error' })
      }
    }

    // ลบรูปโปรไฟล์
    const removePicture = async () => {
      if (!confirm('Remove profile picture?')) return
      try {
        const { data } = await api.delete('/profile/me/picture')
        const base = data?.profilePicture || null
        const ver = data?.updatedAt || Date.now()
        await prefetchAvatar(base, ver)

        // update store profile if present
        const token = store.state.auth?.token || localStorage.getItem('token')
        const user = (store.getters['auth/currentUser']) || {}
        const updatedProfile = data || (user.profile || {})
        store.commit('auth/SET_AUTH', { token, user: { ...user, profile: updatedProfile } })

        store.dispatch('ui/showToast', { message: 'Profile picture removed', type: 'success' })
      } catch (err) {
        store.dispatch('ui/showToast', { message: 'Failed to remove picture', type: 'error' })
      }
    }

    // อัปเดตชื่อ/บิโอ (ถ้าเพิ่งมีรูปครอปค้างอยู่จะส่งไปด้วย)
    const updateProfile = async () => {
      try {
        const formData = new FormData()
        formData.append('profile', new Blob([JSON.stringify({
          name: profileForm.value.name,
          bio: profileForm.value.bio
        })], { type: 'application/json' }))
        if (croppedFile.value) formData.append('file', croppedFile.value)

        const { data: updated } = await api.put('/profile/me', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        // prefetch updated avatar if present
        const base = updated?.profilePicture || null
        const ver = updated?.updatedAt || Date.now()
        await prefetchAvatar(base, ver)

        const token = store.state.auth?.token || localStorage.getItem('token')
        const user = (store.getters['auth/currentUser']) || {}
        store.commit('auth/SET_AUTH', { token, user: { ...user, profile: updated } })

        croppedFile.value = null
        store.dispatch('ui/showToast', { message: 'Profile updated successfully', type: 'success' })
      } catch (err) {
        store.dispatch('ui/showToast', { message: 'Failed to update profile', type: 'error' })
      }
    }

    // Password / Danger
    const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

    const changePassword = async () => {
      if (!isLocalProvider.value) {
        store.dispatch('ui/showToast', { message: 'Google accounts cannot change password here.', type: 'info' })
        return
      }
      if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        store.dispatch('ui/showToast', { message: 'Passwords do not match', type: 'error' })
        return
      }
      try {
        await api.post('/users/change-password', {
          oldPassword: passwordForm.value.oldPassword || null,
          newPassword: passwordForm.value.newPassword
        })
        store.dispatch('ui/showToast', { message: 'Password changed successfully', type: 'success' })
        passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
      } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to change password'
        store.dispatch('ui/showToast', { message: msg, type: 'error' })
      }
    }

    const logout = () => { store.dispatch('auth/logout') }
    const deleteAccount = async () => {
      if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return
      try {
        await api.delete('/users/me')
        store.dispatch('ui/showToast', { message: 'Account deleted', type: 'success' })
        store.dispatch('auth/logout')
      } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to delete account'
        store.dispatch('ui/showToast', { message: msg, type: 'error' })
      }
    }

    // cleanup on unmount: revoke object URLs
    onUnmounted(() => {
      if (avatarBlob.value) { revokeBlobIfNeeded(avatarBlob.value); avatarBlob.value = null }
    })

    return {
      // profile
      profileForm,
      currentAvatarUrl,
      onAvatarError,
      openCropper,
      removePicture,
      updateProfile,

      // cropper
      showCropper,
      onCropDone,
      onCropCancel,

      // password/danger
      isLocalProvider,
      passwordForm,
      changePassword,
      logout,
      deleteAccount
    }
  }
}
</script>
