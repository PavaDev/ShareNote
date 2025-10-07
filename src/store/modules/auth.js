import api from '../../services/api'
import router from "../../components/router"

export default {
  namespaced: true,
  
  state: {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')) || null
  },
  
  getters: {
    isAuthenticated: state => !!state.token,
    currentUser: state => state.user,
    isAdmin: state => state.user?.role === 'ADMIN'
  },
  
  mutations: {
    SET_AUTH(state, { token, user }) {
      state.token = token
      state.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    },
    
    CLEAR_AUTH(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
    },

    UPDATE_USER(state, user) {
        state.user = user
        localStorage.setItem('user', JSON.stringify(user))
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      try {
        const response = await api.post('/auth/login', credentials)
        commit('SET_AUTH', response.data)
        
        if (response.data.user.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/')
        }
        
        return response.data
      } catch (error) {
        throw error.response?.data?.error || 'Login failed'
      }
    },
    
    async register({ commit }, form) {
      try {
        // 1) สมัครด้วย JSON ให้ตรงกับ RegisterRequest
        const body = {
          username: form.username,
          email: form.email,
          name: form.name,       // ถ้า RegisterRequest ไม่มี name ให้เอาออก
          password: form.password,
        }
        const { data } = await api.post('/auth/register', body)
        // data ต้องมี { token, user } ตาม AuthController
        commit('SET_AUTH', data)

        // 2) ถ้ามีรูป โปรไฟล์ -> อัปโหลดหลังจากล็อกอินแล้ว
        if (form.profilePicture) {
          const fd = new FormData()
          fd.append('file', form.profilePicture)
          await api.post('/users/me/picture', fd)

          // ดึงโปรไฟล์ล่าสุดมาอัปเดต store (optional)
          const me = await api.get('/users/me')
          commit('SET_AUTH', { token: data.token, user: me.data })
        }

        router.push('/')
        return data
      } catch (error) {
        // โยนข้อความ error จาก backend ออกไปให้ UI แสดง
        throw error.response?.data || 'Registration failed'
      }
    },
    
    logout({ commit }) {
      commit('CLEAR_AUTH')
      router.push('/login')
    },
    
    initAuth({ commit }) {
      const token = localStorage.getItem('token')
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
    }
  }
}