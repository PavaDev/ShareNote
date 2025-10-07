<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">My Favorites</h1>
      <p class="text-gray-600">Notes you've starred ({{ localNotes.length }})</p>
    </div>

    <div v-if="loading && !localNotes.length" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="localNotes.length === 0" class="text-center py-12">
      <div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
      <p class="text-gray-500 text-lg mb-2">No favorites yet</p>
      <p class="text-gray-400 text-sm">Start adding notes to your favorites by clicking the star icon</p>
    </div>

    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <transition-group name="card-fade">
        <NoteCard
          v-for="n in localNotes"
          :key="n.id"
          :note="n"
          :allow-owner-actions="true" 
          @like="handleLike"
          @favorite="handleFavorite"
          @comment="goDetail"
          class="transition-all"
        />
      </transition-group>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import NoteCard from '../components/note/NoteCard.vue'

export default {
  components: { LoadingSpinner, NoteCard },
  setup () {
    const store = useStore()
    const router = useRouter()

    // raw lists from vuex
    const rawNotes = computed(() => store.state.notes.notes)
    const loading = computed(() => store.state.notes.loading)
    const me = computed(() => store.getters['auth/currentUser'])

    const notes = computed(() => {
      const list = Array.isArray(rawNotes.value) ? rawNotes.value : []
      return list.filter(n => {
        const isPublic =
          typeof n.isPublic !== 'undefined' ? !!n.isPublic : !!n.public
        const ownerId =
          String(n.author?.id ?? n.user?.id ?? '')
        const isMine = ownerId && ownerId === String(me.value?.id ?? '')
        return isPublic || isMine
      })
    })

    // Local state for optimistic updates
    const localNotes = ref([])
    const pendingActions = ref(new Set())

    // Watch for changes from store and sync to local state
    watch(() => notes.value, (newNotes) => {
      localNotes.value = newNotes.map(n => ({
        ...n,
        isLikedByCurrentUser: n.isLikedByCurrentUser ?? n.isLiked,
        isFavoritedByCurrentUser: n.isFavoritedByCurrentUser ?? n.isFavorited,
        likeCount: n.likeCount ?? 0
      }))
    }, { immediate: true, deep: true })

    onMounted(() => {
      store.dispatch('notes/fetchFavorites')
    })

    const handleLike = async (id) => {
      if (pendingActions.value.has(`like-${id}`)) return
      pendingActions.value.add(`like-${id}`)

      // Find the note in local state
      const note = localNotes.value.find(n => String(n.id) === String(id))
      if (!note) return

      // Optimistic update
      const wasLiked = note.isLikedByCurrentUser
      note.isLikedByCurrentUser = !wasLiked
      note.likeCount = (note.likeCount || 0) + (wasLiked ? -1 : 1)

      try {
        await store.dispatch('notes/toggleLike', id)
        
        // Silent background sync (no toast to avoid spam)
        store.dispatch('notes/fetchFavorites')
      } catch (error) {
        // Revert on error
        note.isLikedByCurrentUser = wasLiked
        note.likeCount = (note.likeCount || 0) + (wasLiked ? 1 : -1)
        
        store.dispatch('ui/showToast', { 
          message: 'Failed to update like', 
          type: 'error' 
        })
      } finally {
        pendingActions.value.delete(`like-${id}`)
      }
    }

    const handleFavorite = async (id) => {
      if (pendingActions.value.has(`favorite-${id}`)) return
      pendingActions.value.add(`favorite-${id}`)

      // Find the note in local state
      const noteIndex = localNotes.value.findIndex(n => String(n.id) === String(id))
      if (noteIndex === -1) return

      const note = localNotes.value[noteIndex]
      const wasFavorited = note.isFavoritedByCurrentUser

      // Optimistic update - remove from list immediately when unfavoriting
      if (wasFavorited) {
        // Add fade-out animation
        note.isRemoving = true
        
        setTimeout(() => {
          localNotes.value = localNotes.value.filter(n => String(n.id) !== String(id))
        }, 300) // Match animation duration
      } else {
        note.isFavoritedByCurrentUser = true
      }

      try {
        await store.dispatch('notes/toggleFavorite', id)
        
        // Show success message
        store.dispatch('ui/showToast', { 
          message: wasFavorited ? 'Removed from favorites' : 'Added to favorites', 
          type: 'success' 
        })

        // Refresh from server after a delay to avoid UI flicker
        setTimeout(() => {
          store.dispatch('notes/fetchFavorites')
        }, 300)
      } catch (error) {
        // Revert on error
        if (wasFavorited) {
          // Re-add the note if it was removed
          const originalNote = notes.value.find(n => String(n.id) === String(id))
          if (originalNote) {
            localNotes.value.splice(noteIndex, 0, { 
              ...originalNote,
              isFavoritedByCurrentUser: true 
            })
          }
        } else {
          note.isFavoritedByCurrentUser = false
        }
        
        store.dispatch('ui/showToast', { 
          message: 'Failed to update favorite', 
          type: 'error' 
        })
      } finally {
        pendingActions.value.delete(`favorite-${id}`)
      }
    }

    const goDetail = (id) => router.push(`/notes/${id}`)

    return { 
      localNotes, 
      loading, 
      handleLike, 
      handleFavorite, 
      goDetail 
    }
  }
}
</script>

<style scoped>
/* Card fade animation for removing favorites */
.card-fade-enter-active {
  transition: all 0.3s ease-out;
}

.card-fade-leave-active {
  transition: all 0.3s ease-in;
}

.card-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.card-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.card-fade-move {
  transition: transform 0.3s ease;
}
</style>