import 'babel-polyfill'  // included here for testing
import Vue from 'vue'
import Vuex from 'vuex'
import * as getters from './getters'
import * as actions from './actions'
import mutations from './mutations'

Vue.use(Vuex)

const state = {
  requestManager: null,
  subsets: []
}

const store = new Vuex.Store({
  state,
  getters,
  actions,
  mutations
})

export { store }
