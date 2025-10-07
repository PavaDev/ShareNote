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
        @delete="deleteNote"
      />
    </div>

    <!-- Create/Edit Modal -->
    <NoteFormModal
      v-if="showCreateModal || showEditModal"
      :note="selectedNote"
      @save="saveNote"
      @close="closeModals"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import api from '../services/api'
import NoteCard from '../components/note/NoteCard.vue'
import NoteFormModal from '../components/note/NoteFormModal.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const PRIMARY_DEFAULT = '/public/default-avatar.svg'
const FALLBACK_DEFAULT = '/default-avatar.svg'

export default {
  components: { NoteCard, NoteFormModal, LoadingSpinner },
  setup () {
    const store = useStore()
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const selectedNote = ref(null)

    const currentUser = computed(() => store.getters['auth/currentUser'] || {})
    const profile     = computed(() => currentUser.value?.profile || null)
    const notes       = computed(() => store.state.notes.notes)
    const loading     = computed(() => store.state.notes.loading)

    const displayName = computed(() =>
      profile.value?.name || currentUser.value?.username || 'User'
    )
    const handle = computed(() =>
      profile.value?.username || currentUser.value?.username || ''
    )

    const avatarUrl = computed(() => {
      const raw =
        profile.value?.profilePicture ||
        currentUser.value?.profilePicture ||
        currentUser.value?.avatarUrl ||
        null
      const base = raw || PRIMARY_DEFAULT
      const ver  = profile.value?.updatedAt || currentUser.value?.updatedAt || Date.now()
      return `${base}${String(base).includes('?') ? '&' : '?'}v=${ver}`
    })
    const onAvatarError = (e) => { e.target.src = `${FALLBACK_DEFAULT}?v=${Date.now()}` }

    // โหลดโปรไฟล์ (อัปเดต username/provider) + โหลดโน้ตของฉัน
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/profile/me')
        const token = store.state.auth?.token || localStorage.getItem('token')
        const prev  = currentUser.value || {}
        store.commit('auth/SET_AUTH', {
          token,
          user: { ...prev, username: data?.username || prev.username, profile: data }
        })
      } catch {}
    }

    onMounted(async () => {
      await loadProfile()
      store.dispatch('notes/fetchMyNotes')
    })

    // ===== owner actions =====
    const handleLike = async (noteId) => {
      await store.dispatch('notes/toggleLike', noteId)
      // รีเฟรชรายการเพื่อให้ตัวเลข/สถานะ sync
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
      if (selectedNote.value) {
        await store.dispatch('notes/updateNote', { id: selectedNote.value.id, noteData })
      } else {
        await store.dispatch('notes/createNote', noteData)
      }
      closeModals()
      store.dispatch('notes/fetchMyNotes')
    }

    const deleteNote = async (noteId) => {
      if (confirm('Are you sure you want to delete this note?')) {
        await store.dispatch('notes/deleteNote', noteId)
        store.dispatch('notes/fetchMyNotes')
      }
    }

    return {
      currentUser, profile, displayName, handle,
      avatarUrl, onAvatarError,
      notes, loading,
      showCreateModal, showEditModal, selectedNote,
      openEditModal, closeModals, saveNote, deleteNote,
      handleLike, handleFavorite
    }
  }
}
</script>
