export default {
  namespaced: true,
  
  state: {
    toast: null
  },
  
  mutations: {
    SHOW_TOAST(state, { message, type = 'info' }) {
      state.toast = { message, type }
      setTimeout(() => {
        state.toast = null
      }, 3000)
    }
  },
  
  actions: {
    showToast({ commit }, payload) {
      commit('SHOW_TOAST', payload)
    }
  }
}