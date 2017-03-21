import * as types from './mutation-types'

export const setRequestManager = ({ commit }, manager) => {
  commit(types.SET_REQUEST_MANAGER, manager)
}

export const setSubsets = ({ commit }, subsets) => {
  commit(types.SET_SUBSETS, subsets)
}