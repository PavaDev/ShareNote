<template>
  <teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60" @click="onCancel"></div>

      <!-- Modal -->
      <div class="relative bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold">Crop Profile Picture (1:1)</h3>
          <button class="text-gray-500 hover:text-gray-700" @click="onCancel">✕</button>
        </div>

        <!-- Body -->
        <div class="p-4">
          <!-- Choose image -->
          <div
            v-if="!src"
            class="h-72 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-500"
            @dragover.prevent
            @drop.prevent="onDrop"
          >
            <p class="mb-2">Drop image here or</p>
            <button class="btn btn-secondary" @click="pickFile">Choose Image</button>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
            <p class="mt-2 text-xs">Max 5MB • image only</p>
          </div>

          <!-- Crop -->
          <div v-else class="grid grid-cols-5 gap-4">
            <div class="col-span-4">
              <div class="w-full h-[420px]">
                <img ref="imgEl" :src="src" alt="to-crop" class="max-h-[420px]" />
              </div>
            </div>

            <div class="col-span-1">
              <div class="space-y-3">
                <div class="text-sm text-gray-600">Preview</div>
                <div class="w-28 h-28 rounded-full ring-1 ring-gray-200 overflow-hidden">
                  <img :src="previewDataUrl" class="w-full h-full object-cover" />
                </div>

                <div class="pt-3 space-x-2">
                  <button class="btn btn-secondary btn-sm" @click="zoom(-0.1)">-</button>
                  <button class="btn btn-secondary btn-sm" @click="zoom(0.1)">+</button>
                </div>
                <div class="space-x-2">
                  <button class="btn btn-secondary btn-sm" @click="rotate(-90)">⟲</button>
                  <button class="btn btn-secondary btn-sm" @click="rotate(90)">⟳</button>
                </div>
                <div>
                  <button class="btn btn-light w-full" @click="replace">Choose another</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button class="btn btn-secondary" @click="onCancel">Cancel</button>
          <button class="btn btn-primary" :disabled="!src" @click="confirm">Use this photo</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css' // << ใช้ CSS จาก dist ของ v1.6.2

export default {
  name: 'AvatarCropper',
  props: {
    file: { type: File, default: null },
    size: { type: Number, default: 512 },
    quality: { type: Number, default: 0.9 }
  },
  emits: ['done', 'cancel'],
  setup (props, { emit }) {
    const cropper = ref(null)
    const imgEl = ref(null)
    const src = ref(null)
    const previewDataUrl = ref('')
    const fileInput = ref(null)

    const pickFile = () => fileInput.value?.click()
    const onFileChange = (e) => {
      const file = e.target.files?.[0]; if (!file) return
      loadFile(file); e.target.value = ''
    }
    const onDrop = (e) => {
      const f = e.dataTransfer?.files?.[0]; if (f) loadFile(f)
    }
    const replace = () => pickFile()

    const loadFile = (file) => {
      if (file.size > 5 * 1024 * 1024) return alert('File size exceeds 5MB')
      if (!file.type.startsWith('image/')) return alert('Only image files are allowed')
      const url = URL.createObjectURL(file)
      src.value = url
      createCropperNextTick()
    }

    const createCropperNextTick = () => {
      setTimeout(() => {
        if (cropper.value) { cropper.value.destroy(); cropper.value = null }
        if (!imgEl.value) return
        cropper.value = new Cropper(imgEl.value, {
          aspectRatio: 1,
          viewMode: 1,
          background: false,
          movable: true,
          zoomable: true,
          autoCropArea: 1,
          dragMode: 'move',
          ready: updatePreview,
          crop: updatePreview
        })
      }, 0)
    }

    const updatePreview = () => {
      if (!cropper.value) return
      const c = cropper.value.getCroppedCanvas({ width: 200, height: 200 })
      previewDataUrl.value = c.toDataURL('image/jpeg', 0.9)
    }

    const zoom = (v) => cropper.value && cropper.value.zoom(v)
    const rotate = (deg) => cropper.value && cropper.value.rotate(deg)

    const confirm = () => {
      if (!cropper.value) return
      const canvas = cropper.value.getCroppedCanvas({
        width: props.size, height: props.size, imageSmoothingQuality: 'high'
      })
      canvas.toBlob((blob) => {
        if (!blob) return
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        emit('done', file)
      }, 'image/jpeg', props.quality)
    }

    const onCancel = () => emit('cancel')

    onMounted(() => { if (props.file) loadFile(props.file) })
    onBeforeUnmount(() => {
      if (cropper.value) cropper.value.destroy()
      if (src.value) URL.revokeObjectURL(src.value)
    })

    return {
      imgEl, src, previewDataUrl,
      fileInput, pickFile, onFileChange, onDrop,
      zoom, rotate, confirm, onCancel, replace
    }
  }
}
</script>
