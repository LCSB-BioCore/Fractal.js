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
  [types.SET_FILTER] (state, {filter, value}) {
    Vue.set(state.filters, filter, value)
  },
  [types.SET_TASK] (state, {taskID, taskName, taskState, taskMessage}) {
    // avoid triggering possible watchers if task information remain the same
    if (!state.tasks[taskID] ||
        state.tasks[taskID].taskState !== taskState ||
        state.tasks[taskID].taskMessage !== taskMessage) {
      Vue.set(state.tasks, taskID, {taskID, taskName, taskState, taskMessage})
    }
  },
  [types.UNSET_TASK] (state, taskID) {
    Vue.delete(state.tasks, taskID)
  },
  [types.ADD_CONTROL_PANEL] (state, vm) {
    state.controlPanels.push(vm)
  },
  [types.SET_OPTIONS] (state, options) {
    Object.assign(state.options, options)
  }
}
