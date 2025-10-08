<template>
  <div
    class="card relative hover:scale-105 transition-transform duration-300 cursor-pointer"
    role="button"
    tabindex="0"
    @click="goDetail"
    @keydown.enter.prevent="goDetail"
  >
    <span
      v-if="showVisibility"
      class="absolute top-3 right-3 z-20 px-2 py-0.5 text-[11px] font-semibold rounded-full text-white shadow-md pointer-events-none select-none"
      :class="visibilityBadgeClasses"
    >
      {{ isPublicFlag ? 'public' : 'private' }}
    </span>

    <div
      v-if="note.filePath && note.fileType?.startsWith('image')"
      class="h-48 overflow-hidden rounded-t-2xl relative z-0"
    >
      <img v-if="imageUrl" :src="imageUrl" :alt="note.title" class="w-full h-full object-cover">
      <div v-else class="w-full h-full flex items-center justify-center bg-gray-100">
        <div class="loading-spinner"></div>
      </div>
    </div>

    <div
      v-else-if="note.filePath && note.fileType === 'application/pdf'"
      class="pdf-thumb h-48 overflow-hidden rounded-t-2xl bg-white relative z-0"
    >
      <VuePdfEmbed
        v-if="pdfBlobUrl"
        :source="pdfBlobUrl"
        :page="1"
        class="w-full h-full block"
        style="pointer-events:none"
      />
      <div v-else class="w-full h-full flex items-center justify-center bg-gray-100">
        <div class="loading-spinner"></div>
      </div>
    </div>

    <div class="p-6">
      <span
        v-for="tag in note.tags"
        :key="tag"
        class="inline-block my-2 mr-2 px-2 py-0.5 text-xs rounded-full bg-primary-50 text-primary-700 border border-primary-100"
      >
        #{{ tag }}
      </span>
      <div class="flex items-start justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-800 flex-1">{{ note.title }}</h3>
      </div>

      <p class="text-gray-600 mb-4 line-clamp-3">{{ note.content }}</p>

      <div class="flex items-center justify-between text-sm text-gray-500">
        <div v-if="!hideInteractions" class="flex items-center space-x-4">
          <button
            v-if="!isOwner || allowOwnerActions"
            @click.stop="$emit('like', note.id)"
            class="flex items-center space-x-1 hover:text-red-500 transition-colors"
          >
            <svg class="w-5 h-5" :class="{ 'text-red-500 fill-current': liked }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <span>{{ note.likeCount ?? 0 }}</span>
          </button>

          <button
            v-if="!isOwner"
            @click.stop="$emit('comment', note.id)"
            class="flex items-center space-x-1 hover:text-primary-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <span>{{ note.commentCount ?? (note.comments?.length ?? 0) }}</span>
          </button>

          <button
            v-if="!isOwner || allowOwnerActions"
            @click.stop="$emit('favorite', note.id)"
            class="hover:text-yellow-500 transition-colors"
            :title="favorited ? 'Unfavorite' : 'Favorite'"
          >
            <svg class="w-5 h-5" :class="{ 'text-yellow-500 fill-current': favorited }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </button>
        </div>

        <div v-if="isOwner" class="flex items-center space-x-2">
          <button @click.stop="$emit('edit', note)" class="text-primary-600 hover:text-primary-700">
            Edit
          </button>
          <button @click.stop="$emit('delete', note.id)" class="text-red-600 hover:text-red-700">
            Delete
          </button>
        </div>
      </div>

      <div class="mt-3 pt-3 border-t flex items-center space-x-2">
        <!-- use computed avatarUrl (prefetched blob OR default) -->
        <img :src="avatarUrl" class="w-6 h-6 rounded-full object-cover ring-1 ring-gray-200" alt="avatar" />
        <span class="text-xs text-gray-500">{{ authorName }}</span>
        <span class="text-xs text-gray-400">•</span>
        <span class="text-xs text-gray-500">{{ formatDate(note.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { computed, ref, watch, onUnmounted } from 'vue'
import VuePdfEmbed from 'vue-pdf-embed'
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf'
GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

const DEFAULT_AVATAR = '/default-avatar.svg'

export default {
  components: { VuePdfEmbed },
  props: {
    note: { type: Object, required: true },
    isOwner: { type: Boolean, default: false },
    showVisibility: { type: Boolean, default: false },
    allowOwnerActions: { type: Boolean, default: false },
    hideInteractions: { type: Boolean, default: false }
  },
  setup (props) {
    const router = useRouter()
    const pdfBlobUrl = ref(null)
    const imageUrl = ref(null)

    // Prefetched avatar blob url
    const avatarBlobUrl = ref(null)
    // Keep track of last fetched original URL so we revoke previous blob correctly
    let lastAvatarSource = null

    // Utility: fetch with ngrok header and return object URL
    const fetchFileWithHeaders = async (url) => {
      try {
        const response = await fetch(url, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        if (!response.ok) throw new Error(`Failed to fetch ${url} (${response.status})`)
        const blob = await response.blob()
        return URL.createObjectURL(blob)
      } catch (error) {
        console.error('Error fetching file:', error)
        return null
      }
    }

    // Revoke blob helper
    const revokeBlobIfNeeded = (blobUrl) => {
      try {
        if (blobUrl && blobUrl.startsWith('blob:')) URL.revokeObjectURL(blobUrl)
      } catch (e) { /* ignore */ }
    }

    // Watch note.filePath for media prefetcing (image/pdf)
    watch(
      () => props.note.filePath,
      async (newPath) => {
        // cleanup old blob urls
        if (pdfBlobUrl.value) { revokeBlobIfNeeded(pdfBlobUrl.value); pdfBlobUrl.value = null }
        if (imageUrl.value) { revokeBlobIfNeeded(imageUrl.value); imageUrl.value = null }

        if (newPath) {
          if (props.note.fileType === 'application/pdf') {
            pdfBlobUrl.value = await fetchFileWithHeaders(newPath)
          } else if (props.note.fileType?.startsWith('image')) {
            imageUrl.value = await fetchFileWithHeaders(newPath)
          }
        }
      },
      { immediate: true }
    )

    // Prefetch avatar when author.profile.profilePicture changes
    watch(
      () => props.note.author?.profile?.profilePicture,
      async (rawUrl) => {
        // revoke previous blob if any
        if (avatarBlobUrl.value) { revokeBlobIfNeeded(avatarBlobUrl.value); avatarBlobUrl.value = null }
        lastAvatarSource = null

        if (!rawUrl) {
          // nothing to fetch, will use DEFAULT_AVATAR
          return
        }

        // try to fetch avatar with ngrok header
        try {
          const objUrl = await fetchFileWithHeaders(rawUrl)
          if (objUrl) {
            avatarBlobUrl.value = objUrl
            lastAvatarSource = rawUrl
            return
          }
        } catch (e) {
          console.error('Avatar fetch failed:', e)
        }

        // fallback: try without header (just in case) or use fallback default
        try {
          const resp = await fetch(rawUrl)
          if (resp.ok) {
            const blob = await resp.blob()
            const obj = URL.createObjectURL(blob)
            avatarBlobUrl.value = obj
            lastAvatarSource = rawUrl
            return
          }
        } catch (e) {
          console.warn('Avatar fetch without header failed:', e)
        }

        // final fallback -> leave avatarBlobUrl null so DEFAULT_AVATAR is used
        avatarBlobUrl.value = null
      },
      { immediate: true }
    )

    // computed avatar url used in template (blob or default)
    const avatarUrl = computed(() => {
      return avatarBlobUrl.value || DEFAULT_AVATAR
    })

    const goDetail = () => router.push(`/notes/${props.note.id}`)

    const isPublicFlag = computed(() =>
      (typeof props.note.isPublic !== 'undefined')
        ? !!props.note.isPublic
        : !!props.note.public
    )
    const visibilityBadgeClasses = computed(() =>
      isPublicFlag.value
        ? 'bg-gradient-to-br from-sky-500 to-cyan-600'
        : 'bg-gradient-to-br from-violet-500 to-fuchsia-600'
    )

    const liked = computed(() => props.note.isLikedByCurrentUser ?? props.note.isLiked ?? false)
    const favorited = computed(() => props.note.isFavoritedByCurrentUser ?? props.note.isFavorited ?? false)

    const authorName = computed(() =>
      props.note.author?.profile?.name ||
      props.note.author?.name ||
      props.note.author?.username ||
      'Unknown'
    )
    const formatDate = (date) => {
      try {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      } catch { return '' }
    }

    // cleanup on unmount
    onUnmounted(() => {
      if (pdfBlobUrl.value) revokeBlobIfNeeded(pdfBlobUrl.value)
      if (imageUrl.value) revokeBlobIfNeeded(imageUrl.value)
      if (avatarBlobUrl.value) revokeBlobIfNeeded(avatarBlobUrl.value)
    })

    return {
      goDetail,
      isPublicFlag,
      visibilityBadgeClasses,
      liked,
      favorited,
      avatarUrl,
      authorName,
      formatDate,
      pdfBlobUrl,
      imageUrl
    }
  }
}
</script>

<style scoped>
.line-clamp-3{
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
.pdf-thumb :deep(canvas){
  width: 100% !important;
  height: 100% !important;
  display: block;
  object-fit: cover;
}
.pdf-thumb,
.h-48.overflow-hidden.rounded-t-2xl {
  position: relative;
  z-index: 0;
}

/* Loading Spinner Animation */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
