'use strict'

import requestHandling from '../src/components/mixins/request-handling'
import RequestManager from '../src/services/request-manager'
import store from '../src/store/store'

describe('runAnalysis method', () => {
  const runAnalysis = requestHandling.methods.runAnalysis

  beforeEach(() => {
    const requestManager = new RequestManager(
      {handler: '', thisBaseURL: '', fractalisBaseURL: '', getAuth: () => {}})
    store.dispatch('setRequestManager', requestManager)
  })

  it('returns a promise', () => {
    const rv = runAnalysis({name: '', args: {}})
    expect(rv instanceof Promise).toBe(true)
  })

  it('fails if unknown job state', done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve(123))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValue(Promise.resolve({state: 'FOO', result: ''}))
    runAnalysis({name: '', args: {}})
      .then(done.fail)
      .catch(done)
  })

  it('resolves if job state is successful', done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve(123))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValue(Promise.resolve({state: 'SUCCESS', result: 123}))
    runAnalysis({name: '', args: {}})
      .then(response => {
        expect(response).toBe(123)
        done()
      })
      .catch(done.fail)
  })

  it('rejects if job state is unsuccessful', done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve(123))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValue(Promise.resolve({state: 'FAILURE', result: ''}))
    runAnalysis({name: '', args: {}})
      .then(done.fail)
      .catch(done)
  })

  it('does wait for job state to switch from PENDING to final state', done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve(123))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValues(
        Promise.resolve({state: 'PENDING', result: ''}),
        Promise.resolve({state: 'PENDING', result: ''}),
        Promise.resolve({state: 'PENDING', result: ''}),
        Promise.resolve({state: 'SUCCESS', result: 123})
      )
    runAnalysis({name: '', args: {}})
      .then(response => {
        expect(response).toBe(123)
        expect(store.getters.requestManager.getAnalysisStatus).toHaveBeenCalledTimes(4)
        done()
      })
      .catch(done.fail)
  })
})
