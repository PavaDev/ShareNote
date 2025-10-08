<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
    <div class="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
      <h3 class="text-2xl font-semibold mb-6">
        {{ note ? 'Edit Note' : 'Create New Note' }}
      </h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            v-model="form.title"
            type="text"
            required
            class="input-field"
            placeholder="Enter note title"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Content</label>
          <textarea
            v-model="form.content"
            class="input-field h-32 resize-none"
            placeholder="Write your note content..."
          ></textarea>
        </div>

        <!-- Tags Section -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div class="space-y-2">
            <!-- Predefined Tags -->
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p class="text-xs text-gray-600 mb-2">Select from common tags:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in predefinedTags"
                  :key="tag"
                  type="button"
                  @click="togglePredefinedTag(tag)"
                  class="px-3 py-1 rounded-full text-sm transition-all"
                  :class="form.tags.includes(tag) 
                    ? 'bg-primary-600 text-white hover:bg-primary-700' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'"
                >
                  #{{ tag }}
                </button>
              </div>
            </div>
            
            <!-- Selected Tags Display -->
            <div v-if="form.tags.length > 0" class="flex flex-wrap gap-2 p-3 bg-primary-50 rounded-lg border border-primary-100">
              <span class="text-xs text-primary-700 font-medium w-full mb-1">Selected tags:</span>
              <span
                v-for="(tag, index) in form.tags"
                :key="index"
                class="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
              >
                #{{ tag }}
                <button
                  type="button"
                  @click="removeTag(index)"
                  class="hover:text-primary-900 transition-colors"
                  title="Remove tag"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            </div>

            <!-- Custom Tag Input -->
            <div class="pt-2 border-t border-gray-200">
              <p class="text-xs text-gray-600 mb-2">Or add your own:</p>
              <div class="flex gap-2">
                <input
                  v-model="tagInput"
                  type="text"
                  class="input-field flex-1"
                  placeholder="Type custom tag..."
                  @keydown.enter.prevent="addCustomTag"
                  @keydown.comma.prevent="addCustomTag"
                />
                <button
                  type="button"
                  @click="addCustomTag"
                  class="btn btn-secondary"
                  :disabled="!tagInput.trim()"
                >
                  Add
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-1">Press Enter or comma to add</p>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Attachment (Optional)</label>
          
          <div class="p-4">
            <!-- Choose file (no file selected) -->
            <div
              v-if="!form.file"
              class="h-72 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 transition-colors"
              @dragover.prevent
              @drop.prevent="onDrop"
            >
              <svg class="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="mb-2">Drop file here or</p>
              <button type="button" class="btn btn-secondary" @click="pickFile">Choose File</button>
              <input 
                ref="fileInput" 
                type="file" 
                accept="image/*,application/pdf" 
                class="hidden" 
                @change="handleFileSelect" 
              />
              <p class="mt-2 text-xs">Max 5MB • Images or PDF</p>
            </div>

            <!-- File preview (file selected) -->
            <div v-else class="border-2 border-gray-200 rounded-xl p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <!-- File icon -->
                  <div class="w-12 h-12 rounded-lg flex items-center justify-center"
                       :class="isImageFile ? 'bg-blue-50' : 'bg-red-50'">
                    <svg v-if="isImageFile" class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <svg v-else class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  <!-- File info -->
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ form.file.name }}</p>
                    <p class="text-xs text-gray-500">{{ formatFileSize(form.file.size) }}</p>
                  </div>
                </div>
                
                <!-- Remove button -->
                <button 
                  type="button"
                  @click="removeFile" 
                  class="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove file"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <!-- Image preview -->
              <div v-if="isImageFile && previewUrl" class="mt-3">
                <img :src="previewUrl" alt="Preview" class="w-full h-48 object-cover rounded-lg" />
              </div>
              
              <!-- Replace button -->
              <button 
                type="button"
                class="btn btn-light w-full mt-3" 
                @click="pickFile"
              >
                Choose another file
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <input
            v-model="form.isPublic"
            type="checkbox"
            id="isPublic"
            class="rounded text-primary-600 focus:ring-primary-500"
          />
          <label for="isPublic" class="text-sm text-gray-700">
            Make this note public
          </label>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            {{ note ? 'Update' : 'Create' }} Note
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, computed, onUnmounted } from 'vue'

export default {
  props: {
    note: Object
  },
  emits: ['save', 'close'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const previewUrl = ref(null)
    const tagInput = ref('')
    
    // Predefined common tags
    const predefinedTags = [
      'work',
      'personal',
      'ideas',
      'todo',
      'important',
      'meeting',
      'project',
      'research',
      'tutorial',
      'notes'
    ]
    
    const form = ref({
      title: '',
      content: '',
      isPublic: true,
      tags: [],
      file: null
    })

    const isImageFile = computed(() => {
      return form.value.file?.type?.startsWith('image/')
    })

    const fillFromNote = (n) => {
      if (!n) {
        form.value = { title: '', content: '', isPublic: true, tags: [], file: null }
        cleanupPreview()
        tagInput.value = ''
        return
      }
      form.value.title = n.title ?? ''
      form.value.content = n.content ?? ''
      form.value.isPublic =
        ('isPublic' in n) ? !!n.isPublic
        : ('public' in n) ? !!n.public
        : true
      form.value.tags = n.tags ? [...n.tags] : []
      form.value.file = null
      cleanupPreview()
      tagInput.value = ''
    }

    onMounted(() => fillFromNote(props.note))
    watch(() => props.note, (n) => fillFromNote(n))

    const pickFile = () => {
      fileInput.value?.click()
    }

    const handleFileSelect = (e) => {
      const file = e.target.files?.[0] || null
      if (file) {
        handleFile(file)
      }
      // Reset input
      if (e.target) {
        e.target.value = ''
      }
    }

    const onDrop = (e) => {
      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFile(file)
      }
    }

    const handleFile = (file) => {
      // Validate file type
      const isImage = file.type.startsWith('image/')
      const isPdf = file.type === 'application/pdf'
      
      if (!isImage && !isPdf) {
        alert('Please select an image or PDF file')
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      cleanupPreview()
      form.value.file = file
      updatePreview(file)
    }

    const updatePreview = (file) => {
      if (file && file.type.startsWith('image/')) {
        previewUrl.value = URL.createObjectURL(file)
      }
    }

    const cleanupPreview = () => {
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = null
      }
    }

    const removeFile = () => {
      cleanupPreview()
      form.value.file = null
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    // Tag management
    const togglePredefinedTag = (tag) => {
      const index = form.value.tags.indexOf(tag)
      if (index > -1) {
        // Tag exists, remove it
        form.value.tags.splice(index, 1)
      } else {
        // Tag doesn't exist, add it
        form.value.tags.push(tag)
      }
    }

    const addCustomTag = () => {
      const tag = tagInput.value.trim().toLowerCase()
      if (!tag) return
      
      // Check if tag already exists
      if (form.value.tags.includes(tag)) {
        alert('This tag already exists')
        tagInput.value = ''
        return
      }
      
      // Add tag
      form.value.tags.push(tag)
      tagInput.value = ''
    }

    const removeTag = (index) => {
      form.value.tags.splice(index, 1)
    }

    const handleSubmit = () => {
      emit('save', {
        title: form.value.title?.trim() ?? '',
        content: form.value.content ?? '',
        isPublic: !!form.value.isPublic,
        tags: form.value.tags,
        file: form.value.file || null
      })
    }

    onUnmounted(() => {
      cleanupPreview()
    })

    return {
      form,
      fileInput,
      previewUrl,
      isImageFile,
      tagInput,
      predefinedTags,
      pickFile,
      handleFileSelect,
      onDrop,
      removeFile,
      formatFileSize,
      togglePredefinedTag,
      addCustomTag,
      removeTag,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}
.btn-secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}
.btn-light {
  @apply bg-white border border-gray-300 text-gray-700 hover:bg-gray-50;
}
.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700;
}
</style>