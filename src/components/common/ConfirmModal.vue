<template>
  <teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- backdrop -->
      <div
        class="fixed inset-0 bg-black/40 backdrop-blur-sm"
        @click="emitCancel"
        aria-hidden="true"
      />
      <!-- dialog -->
      <div
        ref="dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-xl ring-1 ring-black/5"
      >
        <div class="p-6">
          <h3 :id="titleId" class="text-lg font-semibold text-gray-900">{{ title }}</h3>
          <p class="mt-2 text-sm text-gray-600" v-if="message">{{ message }}</p>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              ref="cancelBtn"
              type="button"
              class="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
              @click="emitCancel"
              :disabled="loading"
            >
              {{ cancelText }}
            </button>

            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-2"
              @click="emitConfirm"
              :disabled="loading"
            >
              <svg v-if="!loading" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"/>
              </svg>
              <svg v-else class="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <span>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'

export default {
  props: {
    title: { type: String, default: 'Confirm' },
    message: { type: String, default: '' },
    confirmText: { type: String, default: 'Delete' },
    cancelText: { type: String, default: 'Cancel' },
    loading: { type: Boolean, default: false }
  },
  emits: ['confirm', 'cancel'],
  setup (props, { emit }) {
    const dialog = ref(null)
    const cancelBtn = ref(null)
    const titleId = `confirm-title-${Math.floor(Math.random() * 100000)}`

    const onKey = (e) => {
      if (e.key === 'Escape') emit('cancel')
      if (e.key === 'Enter') emit('confirm')
    }

    onMounted(() => {
      document.addEventListener('keydown', onKey)
      // focus the cancel button for safety (user can tab)
      setTimeout(() => cancelBtn.value?.focus(), 0)
    })
    onBeforeUnmount(() => document.removeEventListener('keydown', onKey))

    return {
      dialog, cancelBtn, titleId,
      emitConfirm: () => emit('confirm'),
      emitCancel: () => emit('cancel')
    }
  }
}
</script>

<style scoped>
/* small niceties left for Tailwind; add extra transitions if you like */
</style>
