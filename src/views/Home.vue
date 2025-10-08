<!-- src/views/home.vue -->
<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Public Notes Feed</h1>
      <p class="text-gray-600">Discover and interact with notes from the community</p>
    </div>

    <!-- Search & Filter Section -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <!-- Search Bar -->
      <div class="relative mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by title, content, or tags..."
          class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          @input="handleSearch"
        />
        <svg 
          class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        <!-- Clear button -->
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tag Filters -->
      <div v-if="availableTags.length > 0">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-medium text-gray-700">
            Filter by tags: 
            <span v-if="selectedTags.length > 0" class="text-primary-600">({{ selectedTags.length }} selected)</span>
          </p>
          <button
            v-if="selectedTags.length > 0"
            @click="clearTagFilter"
            class="text-xs text-primary-600 hover:text-primary-700"
          >
            Clear all tags
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in availableTags"
            :key="tag"
            @click="filterByTag(tag)"
            class="px-3 py-1.5 rounded-full text-sm font-medium transition-all transform hover:scale-105"
            :class="selectedTags.includes(tag)
              ? 'bg-primary-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          >
            #{{ tag }}
          </button>
        </div>
      </div>

      <!-- Active Filters Display -->
      <div v-if="selectedTags.length > 0 || searchQuery" class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span class="font-medium">Active filters:</span>
          
          <!-- Selected Tags -->
          <span 
            v-for="tag in selectedTags" 
            :key="tag"
            class="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full"
          >
            #{{ tag }}
            <button @click="filterByTag(tag)" class="hover:text-primary-900">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
          
          <!-- Search Query -->
          <span v-if="searchQuery" class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
            Search: "{{ searchQuery }}"
            <button @click="clearSearch" class="hover:text-gray-900">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredNotes.length === 0" class="text-center py-12">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-gray-500 mb-2">
        {{ searchQuery || selectedTags.length > 0 ? 'No notes found matching your filters' : 'No public notes available yet' }}
      </p>
      <button
        v-if="searchQuery || selectedTags.length > 0"
        @click="clearAllFilters"
        class="text-primary-600 hover:text-primary-700 text-sm font-medium"
      >
        Clear all filters
      </button>
    </div>

    <!-- Notes Grid -->
    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <NoteCard
        v-for="note in filteredNotes"
        :key="note.id"
        :note="note"
        :hide-interactions="isAdmin"
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
import api from '../services/api'

export default {
  components: { NoteCard, LoadingSpinner },
  setup() {
    const store = useStore()
    const showCommentModal = ref(false)
    const selectedNoteId = ref(null)
    const commentContent = ref('')
    const searchQuery = ref('')
    const selectedTags = ref([]) // Changed from selectedTag to selectedTags array
    const availableTags = ref([])
    const searchTimeout = ref(null)

    const notes = computed(() => store.state.notes.notes)
    const loading = computed(() => store.state.notes.loading)
    
    // Check if user is admin from localStorage
    const isAdmin = computed(() => {
      try {
        const userStr = localStorage.getItem('user')
        if (!userStr) return false
        const user = JSON.parse(userStr)
        return user?.role === 'ADMIN'
      } catch (error) {
        console.error('Error parsing user from localStorage:', error)
        return false
      }
    })
    
    // Filter out notes that don't have required data
    const filteredNotes = computed(() => {
      return (notes.value || []).filter(note => note && note.id)
    })

    // Load available tags
    const loadTags = async () => {
      try {
        const response = await api.get('/notes/tags')
        availableTags.value = response.data || []
      } catch (error) {
        console.error('Failed to load tags:', error)
      }
    }

    // Debounced search
    const handleSearch = () => {
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }
      
      searchTimeout.value = setTimeout(async () => {
        selectedTags.value = [] // Clear tag filters when searching
        
        if (searchQuery.value.trim()) {
          try {
            const response = await api.get(`/notes/search?query=${encodeURIComponent(searchQuery.value.trim())}`)
            store.commit('notes/SET_NOTES', response.data)
          } catch (error) {
            console.error('Search failed:', error)
          }
        } else {
          // If search is empty, reload feed
          store.dispatch('notes/fetchFeed')
        }
      }, 300)
    }

    // Filter by tags (supports multiple tags)
    const filterByTag = async (tag) => {
      const index = selectedTags.value.indexOf(tag)
      
      if (index > -1) {
        // Tag already selected, remove it
        selectedTags.value.splice(index, 1)
      } else {
        // Add tag to selection
        selectedTags.value.push(tag)
      }

      searchQuery.value = '' // Clear search when filtering by tags
      
      // If no tags selected, show all
      if (selectedTags.value.length === 0) {
        store.dispatch('notes/fetchFeed')
        return
      }
      
      // Filter by multiple tags (OR logic - show notes that have ANY of the selected tags)
      try {
        // Fetch notes for each tag and combine results
        const promises = selectedTags.value.map(t => api.get(`/notes/tags/${t}`))
        const responses = await Promise.all(promises)
        
        // Combine and deduplicate notes
        const allNotes = []
        const noteIds = new Set()
        
        responses.forEach(response => {
          const notes = response.data?.content || response.data || []
          notes.forEach(note => {
            if (!noteIds.has(note.id)) {
              noteIds.add(note.id)
              allNotes.push(note)
            }
          })
        })
        
        store.commit('notes/SET_NOTES', { content: allNotes })
      } catch (error) {
        console.error('Failed to filter by tags:', error)
      }
    }

    // Clear all tag filters
    const clearTagFilter = () => {
      selectedTags.value = []
      store.dispatch('notes/fetchFeed')
    }

    // Clear search
    const clearSearch = () => {
      searchQuery.value = ''
      store.dispatch('notes/fetchFeed')
    }

    // Clear all filters
    const clearAllFilters = () => {
      searchQuery.value = ''
      selectedTags.value = []
      store.dispatch('notes/fetchFeed')
    }

    onMounted(() => {
      store.dispatch('notes/fetchFeed')
      loadTags()
    })

    const handleLike = async (noteId) => {
      if (isAdmin.value) return
      
      try {
        await store.dispatch('notes/toggleLike', noteId)
      } catch (error) {
        store.dispatch('ui/showToast', { 
          message: 'Failed to update like', 
          type: 'error' 
        })
      }
    }

    const handleFavorite = async (noteId) => {
      if (isAdmin.value) return
      
      try {
        await store.dispatch('notes/toggleFavorite', noteId)
        
        const note = notes.value.find(n => String(n.id) === String(noteId))
        const isFavorited = note?.isFavoritedByCurrentUser ?? note?.isFavorited ?? false
        
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
      filteredNotes,
      loading,
      isAdmin,
      showCommentModal,
      commentContent,
      searchQuery,
      selectedTags,
      availableTags,
      handleSearch,
      filterByTag,
      clearTagFilter,
      clearSearch,
      clearAllFilters,
      handleLike,
      handleFavorite,
      openCommentModal,
      closeCommentModal,
      submitComment
    }
  }
}
</script>