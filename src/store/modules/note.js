// src/store/modules/note.js
import api from '../../services/api'

/** รวมสถานะ like/favorite หลายชื่อให้เป็นชุดเดียวกัน */
function normalizeFlags(obj = {}) {
  const liked =
    obj.isLikedByCurrentUser ??
    obj.likedByCurrentUser ??
    obj.isLiked ??
    obj.liked ??
    false

  const favored =
    obj.isFavoritedByCurrentUser ??
    obj.favoritedByCurrentUser ??
    obj.isFavorited ??
    obj.favorited ??
    false

  return {
    ...obj,
    // like
    isLikedByCurrentUser: !!liked,
    likedByCurrentUser: !!liked,
    isLiked: !!liked,
    liked: !!liked,
    // favorite
    isFavoritedByCurrentUser: !!favored,
    favoritedByCurrentUser: !!favored,
    isFavorited: !!favored,
    favorited: !!favored,
  }
}

const pageContent = (data) => (Array.isArray(data?.content) ? data.content : [])

export default {
  namespaced: true,

  state: {
    notes: [],
    currentNote: null,
    loading: false,
    totalPages: 0,
    commentsByNoteId: {},
    userFlagsById: {}, // { [noteId]: normalizedFlags }
  },

  mutations: {
    SET_LOADING(state, v) { state.loading = v },

    SET_NOTES(state, data) {
      state.notes = pageContent(data)
      state.totalPages = data?.totalPages ?? 0
    },

    SET_CURRENT_NOTE(state, note) {
      state.currentNote = note ? normalizeFlags(note) : null
    },

    REPLACE_NOTE(state, note) {
      const i = state.notes.findIndex(n => String(n.id) === String(note.id))
      if (i !== -1) state.notes.splice(i, 1, normalizeFlags(note))
    },

    PATCH_NOTE(state, { noteId, patch }) {
      const p = normalizeFlags(patch)
      const i = state.notes.findIndex(n => String(n.id) === String(noteId))
      if (i !== -1) state.notes.splice(i, 1, { ...state.notes[i], ...p })

      if (state.currentNote && String(state.currentNote.id) === String(noteId)) {
        state.currentNote = { ...state.currentNote, ...p }
      }
    },

    DELETE_NOTE(state, noteId) {
      state.notes = state.notes.filter(n => String(n.id) !== String(noteId))
      if (state.currentNote && String(state.currentNote.id) === String(noteId)) {
        state.currentNote = null
      }
    },

    SET_COMMENTS(state, { noteId, comments }) {
      state.commentsByNoteId = {
        ...state.commentsByNoteId,
        [noteId]: Array.isArray(comments) ? comments : []
      }
    },

    SET_USER_FLAGS(state, { noteId, flags }) {
      state.userFlagsById = {
        ...state.userFlagsById,
        [noteId]: normalizeFlags(flags)
      }
    },

    MERGE_FLAGS_INTO_FEED(state) {
      state.notes = state.notes.map(n => {
        const f = state.userFlagsById[n.id]
        return f ? normalizeFlags({ ...n, ...f }) : normalizeFlags(n)
      })
    }
  },

  actions: {
    async fetchFeed({ commit, dispatch }, page = 0) {
      commit('SET_LOADING', true)
      try {
        const { data } = await api.get(`/notes/feed?page=${page}&size=10`)
        commit('SET_NOTES', data)
        commit('MERGE_FLAGS_INTO_FEED')
        const items = pageContent(data)
        await Promise.allSettled(items.map(n => dispatch('fetchFlagsForNoteAndMerge', n.id)))
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async fetchMyNotes({ commit, dispatch }, page = 0) {
      commit('SET_LOADING', true)
      try {
        const { data } = await api.get(`/notes/my?page=${page}&size=10`)
        commit('SET_NOTES', data)
        commit('MERGE_FLAGS_INTO_FEED')
        const items = pageContent(data)
        await Promise.allSettled(items.map(n => dispatch('fetchFlagsForNoteAndMerge', n.id)))
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async fetchFavorites({ commit, dispatch }, page = 0) {
      commit('SET_LOADING', true)
      try {
        const { data } = await api.get(`/notes/favorites?page=${page}&size=10`)
        commit('SET_NOTES', data)
        commit('MERGE_FLAGS_INTO_FEED')
        const items = pageContent(data)
        await Promise.allSettled(items.map(n => dispatch('fetchFlagsForNoteAndMerge', n.id)))
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async fetchFlagsForNoteAndMerge({ commit, state }, noteId) {
      try {
        const { data } = await api.get(`/notes/${noteId}`)
        // cache flags
        commit('SET_USER_FLAGS', {
          noteId,
          flags: {
            isLikedByCurrentUser: data.isLikedByCurrentUser,
            likedByCurrentUser: data.likedByCurrentUser,
            isFavoritedByCurrentUser: data.isFavoritedByCurrentUser,
            favoritedByCurrentUser: data.favoritedByCurrentUser,
          }
        })
        commit('REPLACE_NOTE', data)
        if (state.currentNote && String(state.currentNote.id) === String(noteId)) {
          commit('SET_CURRENT_NOTE', data)
        }
      } catch {
        // ignore
      }
    },

    // ---------- FIX: ส่ง public (boolean) ให้ตรงกับฝั่ง Spring ----------
    async createNote({ dispatch }, noteData) {
      const formData = new FormData()

      const payload = {
        title: noteData.title,
        content: noteData.content,
        public: !!noteData.isPublic, // <== สำคัญ
      }
      // กันเหนียวเก็บไว้ใช้งานฝั่ง FE ด้วย
      payload.isPublic = payload.public

      formData.append('note', new Blob([JSON.stringify(payload)], {
        type: 'application/json'
      }))

      if (noteData.file) formData.append('file', noteData.file)

      await api.post('/notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      dispatch('fetchMyNotes')
    },

    async updateNote({ commit }, { id, noteData }) {
      const formData = new FormData()

      const payload = {
        title: noteData.title,
        content: noteData.content,
        public: !!noteData.isPublic, // <== สำคัญ
      }
      payload.isPublic = payload.public

      formData.append('note', new Blob([JSON.stringify(payload)], {
        type: 'application/json'
      }))

      if (noteData.file) formData.append('file', noteData.file)

      const { data } = await api.put(`/notes/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      commit('REPLACE_NOTE', data)
      commit('SET_CURRENT_NOTE', data)
    },
    // -------------------------------------------------------------------

    async deleteNote({ commit }, noteId) {
      await api.delete(`/notes/${noteId}`)
      commit('DELETE_NOTE', noteId)
    },

    async toggleLike({ state, commit, dispatch }, noteId) {
      const view =
        (state.currentNote && String(state.currentNote.id) === String(noteId))
          ? state.currentNote
          : (state.notes.find(n => String(n.id) === String(noteId)) || {})

      const before = normalizeFlags(view)
      const was = !!before.isLikedByCurrentUser
      const beforeCount = Number(before.likeCount ?? 0)

      // optimistic
      commit('PATCH_NOTE', {
        noteId,
        patch: {
          isLikedByCurrentUser: !was,
          likedByCurrentUser: !was,
          isLiked: !was,
          liked: !was,
          likeCount: Math.max(0, beforeCount + (was ? -1 : 1))
        }
      })

      try {
        await api.post(`/notes/${noteId}/like`)
        await dispatch('fetchFlagsForNoteAndMerge', noteId)
      } catch (e) {
        // rollback
        commit('PATCH_NOTE', {
          noteId,
          patch: {
            isLikedByCurrentUser: was,
            likedByCurrentUser: was,
            isLiked: was,
            liked: was,
            likeCount: beforeCount
          }
        })
        throw e
      }
    },

    async toggleFavorite({ state, commit, dispatch }, noteId) {
      const view =
        (state.currentNote && String(state.currentNote.id) === String(noteId))
          ? state.currentNote
          : (state.notes.find(n => String(n.id) === String(noteId)) || {})

      const before = normalizeFlags(view)
      const was = !!before.isFavoritedByCurrentUser

      // optimistic
      commit('PATCH_NOTE', {
        noteId,
        patch: {
          isFavoritedByCurrentUser: !was,
          favoritedByCurrentUser: !was,
          isFavorited: !was,
          favorited: !was
        }
      })

      try {
        await api.post(`/notes/${noteId}/favorite`)
        await dispatch('fetchFlagsForNoteAndMerge', noteId)
      } catch (e) {
        // rollback
        commit('PATCH_NOTE', {
          noteId,
          patch: {
            isFavoritedByCurrentUser: was,
            favoritedByCurrentUser: was,
            isFavorited: was,
            favorited: was
          }
        })
        throw e
      }
    },

    async fetchComments({ commit }, noteId) {
      const { data } = await api.get(`/notes/${noteId}/comments`)
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : [])
      commit('SET_COMMENTS', { noteId, comments: arr })
    },

    async addComment({ dispatch }, { noteId, content }) {
      await api.post(`/notes/${noteId}/comment`, { content })
      await dispatch('fetchComments', noteId)
      await dispatch('fetchFlagsForNoteAndMerge', noteId)
    },

    async fetchNoteById({ commit }, id) {
      commit('SET_LOADING', true)
      try {
        const { data } = await api.get(`/notes/${id}`)
        commit('SET_CURRENT_NOTE', data)
        commit('REPLACE_NOTE', data)
        commit('SET_USER_FLAGS', {
          noteId: id,
          flags: {
            isLikedByCurrentUser: data.isLikedByCurrentUser,
            likedByCurrentUser: data.likedByCurrentUser,
            isFavoritedByCurrentUser: data.isFavoritedByCurrentUser,
            favoritedByCurrentUser: data.favoritedByCurrentUser,
          }
        })
      } finally {
        commit('SET_LOADING', false)
      }
    },
  }
}
