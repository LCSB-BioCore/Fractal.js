import Vue from 'vue'
import types from './mutation-types'

export default {
  [types.SET_DATA] (state, data) {
    // avoid triggering possible watchers if data didn't change
    if (JSON.stringify(state.data) !== JSON.stringify(data)) {
      state.data = data
    }
  },
  [types.SET_REQUEST_MANAGER] (state, manager) {
    state.requestManager = manager
  },
  [types.SET_CHART_MANAGER] (state, manager) {
    state.chartManager = manager
  },
  [types.SET_STATE_MANAGER] (state, manager) {
    state.stateManager = manager
  },
  [types.SET_SUBSETS] (state, subsets) {
    state.subsets = subsets
  },
  [types.SET_FILTER] (state, {source, filter, value}) {
    Vue.set(state.filters, filter, {source, value})
  },
  [types.SET_CONTROL_PANEL] (state, options) {
    Object.assign(state.controlPanel, options)
  },
  [types.SET_OPTIONS] (state, options) {
    Object.assign(state.options, options)
    state.init()
  }
}
