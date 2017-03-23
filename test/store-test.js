import 'babel-polyfill'
import store from '../src/store/store'

describe('store', () => {
  it('should have working setSubsets action', () => {
    const subsets = [[1, 2, 3], [4, 5, 6], [6, 7, 8]]
    store.dispatch('setSubsets', subsets)
    expect(store.state.subsets).toEqual(subsets)
  })
})
