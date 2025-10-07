import { createStore } from 'vuex'
import auth from './modules/auth'
import notes from './modules/note'
import ui from './modules/ui'

export default createStore({
  modules: {
    auth,
    notes,
    ui
  }
})