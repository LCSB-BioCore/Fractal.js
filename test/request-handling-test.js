import requestHandling from '../src/vue/methods/run-analysis'
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

  it('fails if unknown task state', done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve({data: {task_id: 123}}))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValue(Promise.resolve({data: {state: 'FOO', result: ''}}))
    runAnalysis({name: '', args: {}})
      .then(done.fail)
      .catch(done)
  })

  it('resolves if task state is successful', done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve({data: {task_id: 123}}))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValue(Promise.resolve({data: {state: 'SUCCESS', result: 123}}))
    runAnalysis({name: '', args: {}})
      .then(response => {
        expect(response).toBe(123)
        done()
      })
      .catch(done.fail)
  })

  it('rejects if task state is unsuccessful', done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve({data: {task_id: 123}}))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValue(Promise.resolve({data: {state: 'FAILURE', result: ''}}))
    runAnalysis({name: '', args: {}})
      .then(done.fail)
      .catch(done)
  })

  it('does wait for task state to switch from PENDING to final state', done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve({data: {task_id: 123}}))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValues(
        Promise.resolve({data: {state: 'PENDING', result: ''}}),
        Promise.resolve({data: {state: 'PENDING', result: ''}}),
        Promise.resolve({data: {state: 'PENDING', result: ''}}),
        Promise.resolve({data: {state: 'SUCCESS', result: 123}})
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
