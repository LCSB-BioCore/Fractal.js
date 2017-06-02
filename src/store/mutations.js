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
  [types.SET_SUBSETS] (state, subsets) {
    state.subsets = subsets
  },
  [types.SET_FILTER] (state, {filter, value}) {
    state.filters[filter] = value
  },
  [types.SET_TASK] (state, {taskID, taskName, taskState}) {
    // assure to trigger possible external watchers by replacing the entire tasks object
    const tasks = JSON.parse(JSON.stringify(state.tasks))
    tasks[taskID] = {taskID, taskName, taskState}
    state.tasks = tasks
  },
  [types.UNSET_TASK] (state, {taskID}) {
    // assure to trigger possible external watchers by replacing the entire tasks object
    const tasks = JSON.parse(JSON.stringify(state.tasks))
    delete tasks[taskID]
    state.tasks = tasks
  }
}
