import axios from 'axios'
import store from '../store'
import router from '../components/router'

const api = axios.create({
  baseURL: 'https://penetralian-subinternal-danny.ngrok-free.dev/api',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' 
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.commit('auth/CLEAR_AUTH')
      router.push('/login')
      store.dispatch('ui/showToast', {
        message: 'Session expired. Please login again.',
        type: 'error',
      })
    }
    return Promise.reject(error)
  }
)

export default api
