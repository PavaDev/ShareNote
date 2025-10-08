import axios from 'axios'
import store from '../store'
import router from '../components/router'

const api = axios.create({
  baseURL: 'https://protestable-combinatorial-thomas.ngrok-free.dev/api',
  timeout: 10000,
})

// attach headers + auth token
api.interceptors.request.use(
  (config) => {
    // ensure headers object exists
    config.headers = config.headers || {}

    // ngrok interstitial bypass header (added for every request)
    config.headers['ngrok-skip-browser-warning'] = 'true'

    // auth token
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
