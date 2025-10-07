<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
    <div class="bg-white rounded-2xl max-w-2xl w-full p-6">
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

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Attachment (Optional)</label>
          <input
            type="file"
            @change="handleFileSelect"
            accept="image/*,application/pdf"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">Max file size: 5MB (Images or PDF)</p>
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
import { ref, watch, onMounted } from 'vue'

export default {
  props: {
    note: Object
  },
  emits: ['save', 'close'],
  setup(props, { emit }) {
    const form = ref({
      title: '',
      content: '',
      isPublic: true, // default = public
      file: null
    })

    const fillFromNote = (n) => {
      if (!n) {
        form.value = { title: '', content: '', isPublic: true, file: null }
        return
      }
      form.value.title = n.title ?? ''
      form.value.content = n.content ?? ''
      // รองรับทั้ง isPublic และ public จากแบ็กเอนด์
      form.value.isPublic =
        ('isPublic' in n) ? !!n.isPublic
        : ('public' in n) ? !!n.public
        : true
      form.value.file = null
    }

    onMounted(() => fillFromNote(props.note))
    watch(() => props.note, (n) => fillFromNote(n))

    const handleFileSelect = (e) => {
      const file = e.target.files?.[0] || null
      if (file && file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit')
        e.target.value = ''
        return
      }
      form.value.file = file
    }

    const handleSubmit = () => {
      // ส่งค่า boolean แท้ ๆ ให้ฝั่ง store (ซึ่งจะ map ไปเป็น public)
      emit('save', {
        title: form.value.title?.trim() ?? '',
        content: form.value.content ?? '',
        isPublic: !!form.value.isPublic,
        file: form.value.file || null
      })
    }

    return {
      form,
      handleFileSelect,
      handleSubmit
    }
  }
}
</script>
