import Vue from 'vue'
import Vuex from 'vuex'
import mutations from './mutations'
import getters from './getters'
import actions from './actions'

Vue.use(Vuex)

const state = {
  data: [],
  tasks: {},
  requestManager: null,
  chartManager: null,
  stateManager: null,
  controlPanels: [],
  subsets: [],
  filters: {
    ids: []
  },
  options: {
    controlPanelPosition: 'left'
  }
}

export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations
})
