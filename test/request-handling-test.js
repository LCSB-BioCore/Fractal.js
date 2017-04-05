'use strict'

import requestHandling from '../src/components/mixins/request-handling'
import RequestManager from '../src/services/request-manager'
import store from '../src/store/store'

describe('runAnalysis method', () => {
  const runAnalysis = requestHandling.methods.runAnalysis

  beforeEach(() => {
    const requestManager = new RequestManager({handler: '', thisBaseURL: '', fractalisBaseURL: '', getAuth: () => {}})
    store.dispatch('setRequestManager', requestManager)
  })

  it('returns a promise', () => {
    const rv = runAnalysis({name: '', args: {}})
    expect(rv instanceof Promise).toBe(true)
  })

  it('fails if unknown job state', (done) => {
    spyOn(store.getters.requestManager, 'createAnalysis').and.returnValue(Promise.resolve(123))
    spyOn(store.getters.requestManager, 'getAnalysisStatus').and.returnValue(Promise.resolve({state: 'FOO', result: ''}))
    runAnalysis({name: '', args: {}})
      .then(fail)
      .catch(done)
  })
})
