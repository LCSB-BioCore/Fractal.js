import StateManager from '../src/services/state-manager'
import RequestManager from '../src/services/request-manager'
import ChartManager from '../src/services/chart-manager'
import Vue from 'vue'
import stateSaver from '../src/vue/mixins/state-saver'
import store from '../src/store/store'
import Chart from '../src/vue/components/Chart.vue'

describe('state manager', () => {
  let stateManager
  beforeAll(() => {
    stateManager = new StateManager()
    const chartManager = new ChartManager()
    const requestManager = new RequestManager(
      {handler: '', dataSource: '', fractalisNode: '', getAuth: () => {}})
    store.dispatch('setRequestManager', requestManager)
    store.dispatch('setChartManager', chartManager)
  })

  let vm
  beforeEach(() => {
    const container = document.createElement('div')
    const el = document.createElement('div')
    el.id = 'chart'
    document.body.appendChild(container)
    container.appendChild(el)
    const chart = new Vue({
      template: '<div><chart/></div>',
      mixins: [stateSaver],
      components: { Chart }
    })
    vm = chart.$mount('#chart')
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('chart2id', () => {
    it('throws if selector matches more or less than 1 element', () => {
      const el1 = document.createElement('div')
      el1.className = 'bar'
      const el2 = document.createElement('div')
      el2.className = 'bar'
      document.body.appendChild(el1)
      document.body.appendChild(el2)
      let f = () => stateManager.chart2id('#foo', _ => {})
      expect(f).toThrowError(/.+must point to exactly one.+/)
      let g = () => stateManager.chart2id('.bar', _ => {})
      expect(g).toThrowError(/.+must point to exactly one.+/)
    })

    it('throws if selector is no chart component', () => {
      const el = document.createElement('div')
      el.id = 'foo'
      document.body.appendChild(el)
      let f = () => stateManager.chart2id('#foo', _ => {})
      expect(f).toThrowError(/.+must point to a div element with class "fjs-chart".+/)
    })

    it('makes save state request and calls callback with returned id when called back', done => {
      spyOn(store.getters.requestManager, 'saveState').and.returnValue({data: {state_id: 456}})
      const spy = jasmine.createSpy('spy')
      const callback = id => spy(id)
      stateManager.chart2id('.fjs-chart', callback)
      vm.$data._callback('foo', 123).then(() => {
        expect(store.getters.requestManager.saveState).toHaveBeenCalledWith({chartName: 'foo', chartState: 123})
        expect(spy).toHaveBeenCalledWith(456)
        done()
      })
    })
  })

  describe('getState', () => {
    it('throws if request access fails', done => {
      spyOn(store.getters.requestManager, 'requestStateAccess').and.returnValue(Promise.reject(new Error('foo')))
      stateManager.getState(123)
        .then(done.fail)
        .catch(e => {
          expect(e.toString()).toBe('Error: foo')
          done()
        })
    })

    it('throws if getting state fails', done => {
      spyOn(store.getters.requestManager, 'requestStateAccess').and.returnValue(null)
      spyOn(store.getters.requestManager, 'getState').and.returnValue(Promise.reject(new Error('foo')))
      stateManager.getState(123)
        .then(done.fail)
        .catch(e => {
          expect(e.toString()).toBe('Error: foo')
          done()
        })
    })

    it('to return state when status code becomes 200', done => {
      spyOn(store.getters.requestManager, 'requestStateAccess').and.returnValue(null)
      spyOn(store.getters.requestManager, 'getState').and.returnValues(
        Promise.resolve({status: 202}),
        Promise.resolve({status: 202}),
        Promise.resolve({status: 200, data: {state: 'foo'}}))
      stateManager.getState(123)
        .then(state => {
          expect(store.getters.requestManager.getState).toHaveBeenCalledTimes(3)
          expect(state).toBe('foo')
          done()
        })
        .catch(done.fail)
    })

    it('to fail when getting status rejects', done => {
      spyOn(store.getters.requestManager, 'requestStateAccess').and.returnValue(Promise.resolve(''))
      spyOn(store.getters.requestManager, 'getState').and.returnValues(
        Promise.resolve({status: 202}),
        Promise.resolve({status: 202}),
        Promise.reject(new Error('foo')))
      stateManager.getState(123)
        .then(done.fail)
        .catch(error => {
          expect(store.getters.requestManager.getState).toHaveBeenCalledTimes(3)
          expect(error.toString()).toBe('Error: foo')
          done()
        })
    })
  })

  describe('id2chart', () => {
    it('to throw error if selector does match no element', done => {
      spyOn(stateManager, 'getState').and.returnValue(Promise.resolve({chartName: 'boxplot'}))
      stateManager.id2chart('#foo', 123)
        .then(done.fail)
        .catch(e => {
          expect(e.toString()).toContain('exactly one element')
          done()
        })
    })

    it('to throw error if selector does match more than one element', done => {
      const el1 = document.createElement('div')
      el1.className = 'bar'
      const el2 = document.createElement('div')
      el2.className = 'bar'
      document.body.appendChild(el1)
      document.body.appendChild(el2)
      spyOn(stateManager, 'getState').and.returnValue(Promise.resolve({chartName: 'boxplot'}))
      stateManager.id2chart('.bar', 123)
        .then(done.fail)
        .catch(e => {
          expect(e.toString()).toContain('exactly one element')
          done()
        })
    })

    it('to update state if successful', done => {
      spyOn(stateManager, 'getState').and.returnValue(
        Promise.resolve({chartName: '', chartState: {'some': 'thing'}}))
      spyOn(store.getters.chartManager, 'setChart').and.returnValue(vm)
      stateManager.id2chart('.fjs-chart', 123)
        .then(() => {
          expect(vm.$data.some).toBe('thing')
          done()
        })
        .catch(done.fail)
    })

    it('to throw if cannot get state for id', done => {
      spyOn(stateManager, 'getState').and.returnValue(Promise.reject(new Error('foo')))
      stateManager.id2chart('.fjs-chart', 123)
        .then(done.fail)
        .catch(e => {
          expect(e.toString()).toContain('foo')
          done()
        })
    })
  })
})
