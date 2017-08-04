import types from './mutation-types'
import RequestManager from '../services/request-manager'

export default {
  /**
   * Commits RequestManager mutation that will overwrite the old value.
   * @param context The context of the action.
   * @param manager Instance of RequestManager
   */
  setRequestManager: (context, manager) => {
    if (manager instanceof RequestManager) {
      context.commit(types.SET_REQUEST_MANAGER, manager)
    } else {
      throw new Error('The dispatched value must be an instance of RequestManager.')
    }
  },
  /**
   * Commits subsets mutation that will overwrite the old value.
   * @param context The context of the action.
   * @param subsets An array of arrays of ids defining the subsets.
   */
  setSubsets: (context, subsets) => {
    if (subsets instanceof Array &&
        ((subsets.length > 0 && subsets[0] instanceof Array) || !subsets.length) &&
        subsets.every(d => Array.isArray(d))) {
      context.commit(types.SET_SUBSETS, subsets)
    } else {
      throw new Error('The dispatched value must be an Array containing Arrays (unless empty).')
    }
  },
  /**
   * This method is triggered once during initialization. Ask in a certain time interval for all available
   * data in the back end to update the views accordingly. Every interval will commit a data mutation to reflect
   * the current back end state.
   * @param context The action context.
   */
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
  /**
   * Commits a filter mutation that will replace the specified filter with a new value.
   * @param context The action context.
   * @param filter The filter to apply (e.g. 'ids').
   * @param value The value of the new filter (e.g. Array of ids).
   */
  setFilter: (context, {filter, value}) => {
    context.commit(types.SET_FILTER, {filter, value})
  },
  /**
   * Commits a tasks mutation that will add a new task to the store.
   * @param context The context of the action.
   * @param taskID The id of the task.
   * @param taskName The name of the task.
   * @param taskState The current state of the task. (SUCCESS, PENDING, FAILURE)
   * @param taskMessage A message in case the task failed.
   */
  setTask: (context, {taskID, taskName, taskState, taskMessage}) => {
    context.commit(types.SET_TASK, { taskID, taskName, taskState, taskMessage })
  },
  /**
   * Commits a tasks mutation that will remove the task for the given taskID.
   * @param context The context of the action.
   * @param taskID The id of the task to remove.
   */
  unsetTask: (context, {taskID}) => {
    context.commit(types.UNSET_TASK, {taskID})
  },
  /**
   * Commits a control panel vm for keeping track of all such instances.
   * @param context The context of the action.
   * @param taskID The id of the task to remove.
   */
  addControlPanel: (context, vm) => {
    context.commit(types.ADD_CONTROL_PANEL, {vm})
  }
}
