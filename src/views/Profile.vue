<template>
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div class="flex items-center space-x-6">
        <img
          :src="avatarUrl"
          @error="onAvatarError"
          :alt="displayName"
          class="w-24 h-24 rounded-full object-cover ring-4 ring-primary-100"
        />
        <div>
          <h1 class="text-3xl font-bold text-gray-800">{{ displayName }}</h1>
          <p class="text-gray-600">@{{ handle }}</p>
          <p v-if="profile?.bio" class="mt-2 text-gray-700">{{ profile.bio }}</p>
        </div>
      </div>
    </div>

    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-2xl font-semibold text-gray-800">My Notes</h2>
      <button @click="showCreateModal = true" class="btn btn-primary">
        + Create Note
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="notes.length === 0" class="text-center py-12">
      <p class="text-gray-500">You haven't created any notes yet</p>
    </div>

    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <NoteCard
        v-for="note in notes"
        :key="note.id"
        :note="note"
        :is-owner="true"
        :show-visibility="true"
        :allow-owner-actions="true"
        @like="handleLike"
        @favorite="handleFavorite"
        @edit="openEditModal"
        @delete="promptDelete"
      />
    </div>

    <!-- Create/Edit Modal -->
    <NoteFormModal
      v-if="showCreateModal || showEditModal"
      :note="selectedNote"
      @save="saveNote"
      @close="closeModals"
    />

    <!-- Confirm delete modal -->
    <ConfirmModal
      v-if="showDeleteModal"
      :title="deleteTitle"
      :message="deleteMessage"
      :confirmText="deleteConfirmText"
      :cancelText="deleteCancelText"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script>
/*
  Ensure ConfirmModal.vue exists at src/components/common/ConfirmModal.vue
  (use the modal code from the assistant's earlier message if not present).
*/
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import api from '../services/api'
import NoteCard from '../components/note/NoteCard.vue'
import NoteFormModal from '../components/note/NoteFormModal.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import ConfirmModal from '../components/common/ConfirmModal.vue' // path: adjust if needed

const PRIMARY_DEFAULT = '/public/default-avatar.svg'
const FALLBACK_DEFAULT = '/default-avatar.svg'

export default {
  components: { NoteCard, NoteFormModal, LoadingSpinner, ConfirmModal },
  setup () {
    const store = useStore()
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const selectedNote = ref(null)

    const currentUser = computed(() => store.getters['auth/currentUser'] || {})
    const profile     = computed(() => currentUser.value?.profile || null)
    const notes       = computed(() => store.state.notes.notes || [])
    const loading     = computed(() => store.state.notes.loading)

    const displayName = computed(() =>
      profile.value?.name || currentUser.value?.username || 'User'
    )
    const handle = computed(() =>
      profile.value?.username || currentUser.value?.username || ''
    )

    // ---------- Avatar prefetch state ----------
    const avatarBlob = ref(null)            // holds blob: URL when prefetched
    let lastAvatarSource = null             // track last source to avoid unnecessary fetches

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

    const revokeBlobIfNeeded = (blobUrl) => {
      try { if (blobUrl && String(blobUrl).startsWith('blob:')) URL.revokeObjectURL(blobUrl) } catch (e) {}
    }

    // watch profile picture (or other avatar fields) and prefetch
    watch(
      () => (
        profile.value?.profilePicture ||
        currentUser.value?.profilePicture ||
        currentUser.value?.avatarUrl ||
        null
      ),
      async (raw) => {
        // clear previous blob
        if (avatarBlob.value) { revokeBlobIfNeeded(avatarBlob.value); avatarBlob.value = null }
        lastAvatarSource = null

        if (!raw) return

        // append cache-busting param (updatedAt)
        const ver = profile.value?.updatedAt || currentUser.value?.updatedAt || Date.now()
        const url = `${raw}${String(raw).includes('?') ? '&' : '?'}v=${ver}`

        // avoid refetching same url
        if (lastAvatarSource === url && avatarBlob.value) return

        // try with header first (for ngrok)
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
      },
      { immediate: true }
    )

    const avatarUrl = computed(() => avatarBlob.value || PRIMARY_DEFAULT)
    const onAvatarError = (e) => { e.target.src = `${FALLBACK_DEFAULT}?v=${Date.now()}` }

    // LOAD profile + notes (existing logic)
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/profile/me')
        const token = store.state.auth?.token || localStorage.getItem('token')
        const prev  = currentUser.value || {}
        store.commit('auth/SET_AUTH', {
          token,
          user: { ...prev, username: data?.username || prev.username, profile: data }
        })
      } catch (err) {
        // ignore
      }
    }

    onMounted(async () => {
      await loadProfile()
      store.dispatch('notes/fetchMyNotes')
    })

    // owner actions (same as original)
    const handleLike = async (noteId) => {
      await store.dispatch('notes/toggleLike', noteId)
      store.dispatch('notes/fetchMyNotes')
    }

    const handleFavorite = async (noteId) => {
      await store.dispatch('notes/toggleFavorite', noteId)
      store.dispatch('notes/fetchMyNotes')
    }

    const openEditModal = (note) => {
      selectedNote.value = note
      showEditModal.value = true
    }

    const closeModals = () => {
      showCreateModal.value = false
      showEditModal.value = false
      selectedNote.value = null
    }

    const saveNote = async (noteData) => {
      try {
        if (selectedNote.value) {
          await store.dispatch('notes/updateNote', { id: selectedNote.value.id, noteData })
        } else {
          await store.dispatch('notes/createNote', noteData)
        }
        closeModals()
        store.dispatch('notes/fetchMyNotes')
      } catch (error) {
        console.error('Failed to save note:', error)
      } finally {
        // Call the callback to re-enable button
        if (noteData._onComplete) {
          noteData._onComplete()
        }
      }
    }

    // ---- Confirm modal (replacement for window.confirm) ----
    const showDeleteModal = ref(false)
    const deletingId = ref(null)
    const isDeleting = ref(false)

    const deleteTitle = 'Delete note'
    const deleteMessage = 'Are you sure you want to permanently delete this note? This action cannot be undone.'
    const deleteConfirmText = 'Delete'
    const deleteCancelText = 'Cancel'

    // called by NoteCard when user clicks Delete
    const promptDelete = (noteId) => {
      deletingId.value = noteId
      showDeleteModal.value = true
    }

    const confirmDelete = async () => {
      if (!deletingId.value) return
      try {
        isDeleting.value = true
        await store.dispatch('notes/deleteNote', deletingId.value)
        await store.dispatch('notes/fetchMyNotes')
        store.dispatch('ui/showToast', { message: 'Note deleted', type: 'success' })
      } catch (err) {
        store.dispatch('ui/showToast', { message: 'Failed to delete note', type: 'error' })
      } finally {
        isDeleting.value = false
        showDeleteModal.value = false
        deletingId.value = null
      }
    }

    const cancelDelete = () => {
      showDeleteModal.value = false
      deletingId.value = null
    }

    const deleteNote_old = async (noteId) => {
      // kept for reference only — not used
      if (confirm('Are you sure you want to delete this note?')) {
        await store.dispatch('notes/deleteNote', noteId)
        store.dispatch('notes/fetchMyNotes')
      }
    }

    const deleteNote = confirmDelete // optional alias

    // cleanup on unmount
    onUnmounted(() => {
      if (avatarBlob.value) { revokeBlobIfNeeded(avatarBlob.value); avatarBlob.value = null }
    })

    return {
      currentUser, profile, displayName, handle,
      avatarUrl, onAvatarError,
      notes, loading,
      showCreateModal, showEditModal, selectedNote,
      openEditModal, closeModals, saveNote, deleteNote, handleLike, handleFavorite,

      // confirm modal bindings
      showDeleteModal, deletingId, isDeleting,
      deleteTitle, deleteMessage, deleteConfirmText, deleteCancelText,
      promptDelete, confirmDelete, cancelDelete
    }
  }
}
</script>
