import types from './mutation-types'

export default {
  setRequestManager: (context, manager) => {
    context.commit(types.SET_REQUEST_MANAGER, manager)
  },
  setSubsets: (context, subsets) => {
    context.commit(types.SET_SUBSETS, subsets)
  },
  updateData: context => {
    context.getters.requestManager.getAllDataStatus().then(response => {
      const data = response
      context.commit(types.SET_DATA, data)
    }).catch(error => {
      console.error(error) // TODO: Notify user about this
    }).then(() => { // finally
      setTimeout(() => {
        context.dispatch('updateData')
      }, 2000)
    })
  }
}
