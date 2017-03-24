import types from './mutation-types'

export default {
  setRequestManager: ({ commit }, manager) => {
    commit(types.SET_REQUEST_MANAGER, manager)
  },
  setSubsets: ({ commit }, subsets) => {
    commit(types.SET_SUBSETS, subsets)
  }
}
