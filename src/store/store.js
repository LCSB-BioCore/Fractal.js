import Vue from 'vue'
import Vuex from 'vuex'
import mutations from './mutations'
import getters from './getters'
import actions from './actions'

Vue.use(Vuex)

const state = {
  loadedData: [],
  requestManager: null,
  subsets: []
}

export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations
})
