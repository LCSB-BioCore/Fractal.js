import store from '../src/store/store'
import RequestManager from '../src/services/request-manager'

describe('store', () => {
  describe('setSubsets action', () => {
    it('should correctly set store values', () => {
      const subsets = [[1, 2, 3], [4, 5, 6], [6, 7, 8]]
      store.dispatch('setSubsets', subsets)
      expect(store.getters.subsets).toEqual(subsets)
    })

    it('should work with empty array', () => {
      const subsets = []
      store.dispatch('setSubsets', subsets)
      expect(store.getters.subsets).toEqual(subsets)
    })

    it('should fail if invalid subsets given', () => {
      const f = () => store.dispatch('setSubsets', ['a', [1, 2, 3]])
      const g = () => store.dispatch('setSubsets', {a: 1})
      expect(f).toThrow()
      expect(g).toThrow()
    })
  })

  describe('setRequestManager action', () => {
    it('should correctly set store values', () => {
      const requestManager = new RequestManager({
        handler: 'ada',
        dataSource: 'https://localhost:1234',
        fractalisNode: 'https://localhost:4321',
        getAuth: () => ({token: '1234567890'})
      })
      store.dispatch('setRequestManager', requestManager)
      expect(store.getters.requestManager).not.toBeNull()
    })

    it('should fail if set value is no request manager', () => {
      const requestManager = {}
      const f = () => store.dispatch('setRequestManager', requestManager)
      expect(f).toThrow()
    })
  })

  afterAll(() => {
    document.body.innerHTML = ''
  })
})
