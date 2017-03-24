import store from '../src/store/store'
import RequestManager from '../src/services/request-manager'

describe('store', () => {
  it('should have working setSubsets action', () => {
    const subsets = [[1, 2, 3], [4, 5, 6], [6, 7, 8]]
    store.dispatch('setSubsets', subsets)
    expect(store.state.subsets).toEqual(subsets)
  })

  it('should have working setRequestManager action', () => {
    const requestManager = new RequestManager({
      handler: 'ada',
      thisBaseURL: 'https://localhost:1234',
      fractalisBaseURL: 'https://localhost:4321',
      getAuth: () => ({token: '1234567890'})
    })
    store.dispatch('setRequestManager', requestManager)
    expect(store.state.requestManager).not.toBeNull()
  })
})
