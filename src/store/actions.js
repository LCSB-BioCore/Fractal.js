import types from './mutation-types'

export default {
  setRequestManager: (context, manager) => {
    context.commit(types.SET_REQUEST_MANAGER, manager)
  },
  setSubsets: (context, subsets) => {
    context.commit(types.SET_SUBSETS, subsets)
  },
  updateData: context => {
    context.getters.requestManager.getAllDataStates().then(response => {
      const data = response.data.data_states
      context.commit(types.SET_DATA, data)
    }).catch(error => {
      console.error(error) // TODO: Notify user about this
    }).then(() => { // finally
      setTimeout(() => {
        context.dispatch('updateData')
      }, 2000)
    })
  },
  setFilter: (context, {filter, value}) => {
    context.commit(types.SET_FILTER, {filter, value})
  },
  setTask: (context, {taskID, taskName, taskState}) => {
    context.commit(types.SET_TASK, {taskID, taskName, taskState})
  },
  unsetTask: (context, {taskID}) => {
    context.commit(types.UNSET_TASK, {taskID})
  }
}
