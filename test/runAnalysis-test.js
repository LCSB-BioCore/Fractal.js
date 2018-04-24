import Vue from 'vue'
import RunAnalysis from '../src/vue/mixins/run-analysis'
import RequestManager from '../src/services/request-manager'
import store from '../src/store/store'

describe('runAnalysis method', () => {
  let vm
  beforeEach(() => {
    vm = new Vue({
      mixins: [RunAnalysis]
    })
    const requestManager = new RequestManager(
      {handler: '', dataSource: '', fractalisNode: '', getAuth: () => {}})
    store.dispatch('setRequestManager', requestManager)
  })

  it('fails if unknown task state', done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve({data: {task_id: 123}}))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValue(Promise.resolve({data: {state: 'FOO', result: ''}}))
    vm.runAnalysis('', {})
      .then(() => {
        fail()
      })
      .catch(() => {
        done()
      })
  })

  it('resolves if task state is successful', done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve({data: {task_id: 123}}))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValue(Promise.resolve({data: {state: 'SUCCESS', result: 123}}))
    vm.runAnalysis('', {})
      .then(response => {
        expect(response).toBe(123)
        done()
      })
      .catch(() => fail())
  })

  it('rejects if task state is unsuccessful', done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve({data: {task_id: 123}}))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValue(Promise.resolve({data: {state: 'FAILURE', result: ''}}))
    vm.runAnalysis('', {})
      .then(() => fail())
      .catch(() => done())
  })

  it('does wait for task state to switch from SUBMITTED to final state', done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve({data: {task_id: 123}}))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValues(
        Promise.resolve({data: {state: 'SUBMITTED', result: ''}}),
        Promise.resolve({data: {state: 'SUBMITTED', result: ''}}),
        Promise.resolve({data: {state: 'SUBMITTED', result: ''}}),
        Promise.resolve({data: {state: 'SUCCESS', result: 123}})
      )
    vm.runAnalysis('', {})
      .then(response => {
        expect(response).toBe(123)
        expect(store.getters.requestManager.getAnalysisStatus).toHaveBeenCalledTimes(4)
        done()
      })
      .catch(() => fail())
  })

  afterAll(() => {
    document.body.innerHTML = ''
  })
})
