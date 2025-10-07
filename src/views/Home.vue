<!-- src/views/home.vue -->
<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Public Notes Feed</h1>
      <p class="text-gray-600">Discover and interact with notes from the community</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="notes.length === 0" class="text-center py-12">
      <p class="text-gray-500">No public notes available yet</p>
    </div>

    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <NoteCard
        v-for="note in notes"
        :key="note.id"
        :note="note"
        @like="handleLike"
        @favorite="handleFavorite"
        @comment="openCommentModal"
      />
    </div>

    <!-- Comment Modal -->
    <div v-if="showCommentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 class="text-xl font-semibold mb-4">Add Comment</h3>
        <textarea
          v-model="commentContent"
          class="input-field h-32 resize-none"
          placeholder="Write your comment..."
        ></textarea>
        <div class="flex justify-end space-x-3 mt-4">
          <button @click="closeCommentModal" class="btn btn-secondary">Cancel</button>
          <button 
            @click="submitComment" 
            class="btn btn-primary"
            :disabled="!commentContent.trim()"
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import NoteCard from '../components/note/NoteCard.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

export default {
  components: { NoteCard, LoadingSpinner },
  setup() {
    const store = useStore()
    const showCommentModal = ref(false)
    const selectedNoteId = ref(null)
    const commentContent = ref('')

    const notes = computed(() => store.state.notes.notes)
    const loading = computed(() => store.state.notes.loading)

    onMounted(() => {
      store.dispatch('notes/fetchFeed')
    })

    const handleLike = async (noteId) => {
      try {
        await store.dispatch('notes/toggleLike', noteId)
        // Optional: Show toast for like
        // store.dispatch('ui/showToast', { 
        //   message: 'Like updated', 
        //   type: 'success' 
        // })
      } catch (error) {
        store.dispatch('ui/showToast', { 
          message: 'Failed to update like', 
          type: 'error' 
        })
      }
    }

    const handleFavorite = async (noteId) => {
      try {
        // First toggle the favorite
        await store.dispatch('notes/toggleFavorite', noteId)
        
        // Find the note to check its new favorite status
        const note = notes.value.find(n => String(n.id) === String(noteId))
        const isFavorited = note?.isFavoritedByCurrentUser ?? note?.isFavorited ?? false
        
        // Show appropriate toast message
        store.dispatch('ui/showToast', { 
          message: isFavorited ? 'Added to favorites' : 'Removed from favorites', 
          type: 'success' 
        })
      } catch (error) {
        store.dispatch('ui/showToast', { 
          message: 'Failed to update favorite', 
          type: 'error' 
        })
      }
    }

    const openCommentModal = (noteId) => {
      selectedNoteId.value = noteId
      showCommentModal.value = true
    }

    const closeCommentModal = () => {
      showCommentModal.value = false
      commentContent.value = ''
      selectedNoteId.value = null
    }

    const submitComment = async () => {
      if (!commentContent.value.trim()) return
      
      try {
        await store.dispatch('notes/addComment', {
          noteId: selectedNoteId.value,
          content: commentContent.value
        })
        
        store.dispatch('ui/showToast', { 
          message: 'Comment posted successfully', 
          type: 'success' 
        })
        
        closeCommentModal()
      } catch (error) {
        store.dispatch('ui/showToast', { 
          message: 'Failed to post comment', 
          type: 'error' 
        })
      }
    }

    return {
      notes,
      loading,
      showCommentModal,
      commentContent,
      handleLike,
      handleFavorite,
      openCommentModal,
      closeCommentModal,
      submitComment
    }
  }
}
</script>