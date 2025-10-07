<template>
  <div class="max-w-4xl mx-auto">
    <div v-if="loading" class="flex justify-center py-16">
      <LoadingSpinner />
    </div>

    <div v-else-if="!note" class="bg-white rounded-2xl shadow-lg p-8">
      <p class="text-gray-600">Note not found.</p>
      <router-link to="/" class="text-primary-600 hover:text-primary-700">← Back</router-link>
    </div>

    <div v-else class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <!-- Header -->
      <div class="p-8">
        <div class="flex items-start justify-between gap-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ note.title }}</h1>

            <div class="flex items-center gap-3 text-sm text-gray-600">
              <span class="inline-flex items-center gap-2">
                <img
                  :src="authorAvatar"
                  @error="onAuthorAvatarError"
                  class="w-6 h-6 rounded-full object-cover ring-1 ring-gray-200"
                  alt="author"
                />
                {{ authorName }}
              </span>
              <span>•</span>
              <span>{{ formatDate(note.createdAt) }}</span>
              <span v-if="note.tags?.length">•</span>
              <div v-if="note.tags?.length" class="flex flex-wrap gap-2">
                <span
                  v-for="t in note.tags"
                  :key="t"
                  class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs"
                >
                  #{{ t }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick actions -->
          <div class="flex items-center gap-4">
            <!-- Like -->
            <button
              @click="handleLike"
              :disabled="likeLoading"
              class="flex items-center gap-1 hover:text-red-500 transition-all transform hover:scale-110 disabled:opacity-50"
              :aria-pressed="localLiked"
              :title="localLiked ? 'Unlike' : 'Like'"
            >
              <svg
                class="w-6 h-6 transition-all"
                :class="{ 
                  'text-red-500 scale-110': localLiked,
                  'animate-ping-once': justLiked 
                }"
                :fill="localLiked ? 'currentColor' : 'none'"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span class="text-sm font-medium">{{ localLikeCount }}</span>
            </button>

            <!-- Favorite -->
            <button
              @click="handleFavorite"
              :disabled="favoriteLoading"
              class="hover:text-yellow-500 transition-all transform hover:scale-110 disabled:opacity-50"
              :aria-pressed="localFavorited"
              :title="localFavorited ? 'Unfavorite' : 'Favorite'"
            >
              <svg
                class="w-6 h-6 transition-all"
                :class="{ 
                  'text-yellow-500 scale-110': localFavorited,
                  'animate-ping-once': justFavorited 
                }"
                :fill="localFavorited ? 'currentColor' : 'none'"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Media -->
      <div v-if="hasMedia" class="px-8">
        <!-- Image -->
        <img
          v-if="isImage"
          :src="mediaUrl"
          :alt="note.title"
          class="w-full rounded-xl border border-gray-100"
        />
        <!-- PDF (หน้าแรก) -->
        <div v-else-if="isPdf" class="rounded-xl border border-gray-100 overflow-hidden">
          <VuePdfEmbed :source="mediaUrl" :page="1" class="w-full" />
          <div class="p-3 text-right">
            <a :href="mediaUrl" target="_blank" rel="noopener" class="text-primary-600 hover:text-primary-700 text-sm">
              Open full PDF ↗
            </a>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-8 pt-4">
        <article class="prose max-w-none">
          <p class="whitespace-pre-line text-gray-800 leading-relaxed">{{ note.content }}</p>
        </article>
      </div>

      <hr class="border-gray-100" />

      <!-- Comments -->
      <div class="p-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">
          Comments <span class="text-gray-500 font-normal">({{ localComments.length }})</span>
        </h2>

        <div class="mb-6">
          <textarea
            v-model="commentContent"
            placeholder="Write a comment..."
            class="input-field w-full h-28 resize-none"
          ></textarea>
          <div class="flex justify-end mt-3">
            <button 
              class="btn btn-primary" 
              @click="submitComment" 
              :disabled="!commentContent.trim() || commentSubmitting"
            >
              <span v-if="!commentSubmitting">Post Comment</span>
              <span v-else class="flex items-center">
                <svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Posting...
              </span>
            </button>
          </div>
        </div>

        <div v-if="localComments.length" class="space-y-4">
          <div 
            v-for="c in localComments" 
            :key="c.id" 
            class="rounded-xl border border-gray-100 p-4 transition-all"
            :class="{ 'animate-slide-in': c.isNew }"
          >
            <div class="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <img
                :src="commentAvatar(c)"
                @error="onCommentAvatarError"
                class="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200"
                alt="commenter"
              />
              <strong class="text-gray-800">{{ displayAuthor(c) }}</strong>
              <span>• {{ formatDate(c.createdAt) }}</span>

              <!-- Delete comment (ADMIN only) -->
              <button
                v-if="isAdmin"
                @click="deleteComment(c.id)"
                class="ml-auto text-red-600 hover:text-red-700 px-2 py-0.5 text-xs rounded hover:bg-red-50 transition-colors"
                title="Delete comment"
              >
                Delete
              </button>
            </div>
            <div class="text-gray-800 whitespace-pre-line">{{ c.content }}</div>
          </div>
        </div>
        <div v-else class="text-gray-500">No comments yet.</div>

        <div class="mt-8">
          <router-link to="/" class="text-primary-600 hover:text-primary-700">← Back to feed</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import api from '../services/api'

// PDF viewer
import VuePdfEmbed from 'vue-pdf-embed'
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf'
GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

const PRIMARY_DEFAULT = '/public/default-avatar.svg'
const FALLBACK_DEFAULT = '/default-avatar.svg'

export default {
  components: { LoadingSpinner, VuePdfEmbed },
  setup () {
    const store = useStore()
    const route = useRoute()
    const rawId = route.params.id
    const id = isNaN(Number(rawId)) ? String(rawId) : Number(rawId)

    const loading = computed(() => store.state.notes.loading)
    const current = computed(() => store.state.notes.currentNote)
    const list = computed(() => store.state.notes.notes)
    const note = computed(() => current.value || list.value.find(n => String(n.id) === String(id)))

    const comments = computed(() => {
      const bucket = store.state.notes.commentsByNoteId || {}
      return bucket[id] || []
    })

    // Local state for optimistic UI updates
    const localLiked = ref(false)
    const localFavorited = ref(false)
    const localLikeCount = ref(0)
    const localComments = ref([])
    const likeLoading = ref(false)
    const favoriteLoading = ref(false)
    const commentSubmitting = ref(false)
    const justLiked = ref(false)
    const justFavorited = ref(false)

    // Watch for changes from store and sync to local state
    watch(() => note.value, (newNote) => {
      if (newNote) {
        localLiked.value = !!(newNote.isLikedByCurrentUser ?? newNote.isLiked)
        localFavorited.value = !!(newNote.isFavoritedByCurrentUser ?? newNote.isFavorited)
        localLikeCount.value = newNote.likeCount ?? 0
      }
    }, { immediate: true })

    watch(() => comments.value, (newComments) => {
      localComments.value = newComments.map(c => ({ ...c, isNew: false }))
    }, { immediate: true })

    // ADMIN check
    const currentUser = computed(() => store.getters['auth/currentUser'])
    const isAdmin = computed(() => store.getters['auth/isAdmin'] || currentUser.value?.role === 'ADMIN')

    onMounted(async () => {
      await store.dispatch('notes/fetchNoteById', id)
      await store.dispatch('notes/fetchComments', id)
    })

    const commentContent = ref('')

    const handleLike = async () => {
      if (likeLoading.value) return
      
      likeLoading.value = true
      
      // Optimistic update
      const wasLiked = localLiked.value
      localLiked.value = !localLiked.value
      localLikeCount.value += localLiked.value ? 1 : -1
      
      // Animation
      if (localLiked.value) {
        justLiked.value = true
        setTimeout(() => { justLiked.value = false }, 600)
      }

      try {
        await store.dispatch('notes/toggleLike', id)
        // Silently sync in background without refetching
        const response = await api.get(`/notes/${id}`)
        if (response.data) {
          localLikeCount.value = response.data.likeCount ?? localLikeCount.value
        }
      } catch (error) {
        // Revert on error
        localLiked.value = wasLiked
        localLikeCount.value += wasLiked ? 1 : -1
        store.dispatch('ui/showToast', { 
          message: 'Failed to update like', 
          type: 'error' 
        })
      } finally {
        likeLoading.value = false
      }
    }

    const handleFavorite = async () => {
      if (favoriteLoading.value) return
      
      favoriteLoading.value = true
      
      // Optimistic update
      const wasFavorited = localFavorited.value
      localFavorited.value = !localFavorited.value
      
      // Animation
      if (localFavorited.value) {
        justFavorited.value = true
        setTimeout(() => { justFavorited.value = false }, 600)
      }

      try {
        await store.dispatch('notes/toggleFavorite', id)
        store.dispatch('ui/showToast', { 
          message: localFavorited.value ? 'Added to favorites' : 'Removed from favorites', 
          type: 'success' 
        })
      } catch (error) {
        // Revert on error
        localFavorited.value = wasFavorited
        store.dispatch('ui/showToast', { 
          message: 'Failed to update favorite', 
          type: 'error' 
        })
      } finally {
        favoriteLoading.value = false
      }
    }

    const submitComment = async () => {
      const content = commentContent.value.trim()
      if (!content || commentSubmitting.value) return
      
      commentSubmitting.value = true

      // Optimistic UI: Add temporary comment
      const tempComment = {
        id: `temp-${Date.now()}`,
        content,
        createdAt: new Date().toISOString(),
        authorName: currentUser.value?.profile?.name || currentUser.value?.username || 'You',
        authorProfile: currentUser.value?.profile?.profilePicture || null,
        isNew: true
      }
      
      localComments.value = [...localComments.value, tempComment]
      commentContent.value = ''

      try {
        await store.dispatch('notes/addComment', { noteId: id, content })
        // Refresh comments from server
        await store.dispatch('notes/fetchComments', id)
        store.dispatch('ui/showToast', { 
          message: 'Comment posted', 
          type: 'success' 
        })
      } catch (error) {
        // Remove temp comment on error
        localComments.value = localComments.value.filter(c => c.id !== tempComment.id)
        commentContent.value = content // Restore content
        store.dispatch('ui/showToast', { 
          message: 'Failed to post comment', 
          type: 'error' 
        })
      } finally {
        commentSubmitting.value = false
      }
    }

    const deleteComment = async (commentId) => {
      if (!isAdmin.value) return
      if (!confirm('Delete this comment?')) return
      
      // Optimistic UI: Remove immediately
      const originalComments = [...localComments.value]
      localComments.value = localComments.value.filter(c => String(c.id) !== String(commentId))

      try {
        try {
          await api.delete(`/notes/${id}/comments/${commentId}`)
        } catch (_) {
          await api.delete(`/admin/comments/${commentId}`)
        }
        await store.dispatch('notes/fetchComments', id)
        store.dispatch('ui/showToast', { message: 'Comment deleted', type: 'success' })
      } catch (e) {
        // Revert on error
        localComments.value = originalComments
        store.dispatch('ui/showToast', { message: 'Failed to delete comment', type: 'error' })
      }
    }

    // ===== Media from backend =====
    const hasMedia = computed(() => !!note.value?.filePath)
    const isImage = computed(() => (note.value?.fileType || '').startsWith('image'))
    const isPdf = computed(() => (note.value?.fileType || '') === 'application/pdf')
    const mediaUrl = computed(() => {
      if (!note.value?.filePath) return ''
      const base = note.value.filePath
      const ver = note.value?.updatedAt || Date.now()
      return `${base}${base.includes('?') ? '&' : '?'}v=${ver}`
    })

    // ----- Avatars -----
    const authorName = computed(
      () =>
        note.value?.author?.profile?.name ||
        note.value?.author?.name ||
        note.value?.author?.username ||
        'Unknown'
    )
    const authorAvatar = computed(() => {
      const u = note.value?.author
      const raw = u?.profile?.profilePicture || u?.profilePicture || u?.avatarUrl || null
      const base = raw || PRIMARY_DEFAULT
      const ver = u?.updatedAt || note.value?.updatedAt || Date.now()
      return `${base}${base.includes('?') ? '&' : '?'}v=${ver}`
    })
    const onAuthorAvatarError = (e) => {
      e.target.src = `${FALLBACK_DEFAULT}?v=${Date.now()}`
    }

    const displayAuthor = (c) => c.authorName || 'Someone'

    const commentAvatar = (c) => {
      const raw = c?.authorProfile || null
      const base = raw || PRIMARY_DEFAULT
      const ver = c?.updatedAt || c?.createdAt || Date.now()
      return `${base}${base.includes('?') ? '&' : '?'}v=${ver}`
    }
    const onCommentAvatarError = (e) => {
      e.target.src = `${FALLBACK_DEFAULT}?v=${Date.now()}`
    }

    const formatDate = (iso) => {
      try {
        return new Date(iso).toLocaleString()
      } catch {
        return ''
      }
    }

    return {
      loading,
      note,
      localLiked,
      localFavorited,
      localLikeCount,
      localComments,
      likeLoading,
      favoriteLoading,
      commentSubmitting,
      justLiked,
      justFavorited,
      commentContent,
      handleLike,
      handleFavorite,
      submitComment,
      deleteComment,
      isAdmin,
      hasMedia,
      isImage,
      isPdf,
      mediaUrl,
      authorName,
      authorAvatar,
      onAuthorAvatarError,
      displayAuthor,
      commentAvatar,
      onCommentAvatarError,
      formatDate
    }
  }
}
</script>

<style scoped>
@keyframes ping-once {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-ping-once {
  animation: ping-once 0.6s ease-out;
}

.animate-slide-in {
  animation: slide-in 0.4s ease-out;
}
</style>