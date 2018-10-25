import Vue from 'vue'
import Chart from '../src/vue/components/Chart.vue'
import RunAnalysis from '../src/vue/mixins/run-analysis'
import RequestManager from '../src/services/request-manager'
import store from '../src/store/store'

describe('Chart component', () => {
  let vm
  beforeEach(() => {
    const SomeChart = Vue.component('some-chart', {
      mixins: [RunAnalysis],
      components: {Chart},
      template: '<chart ref="chart"><div></div></chart>'
    })
    const Component = Vue.extend(SomeChart)
    const propsData = {}
    vm = new Component({propsData}).$mount()

    const requestManager = new RequestManager({handler: '', dataSource: '', fractalisNode: '', getAuth: () => {}})
    store.dispatch('setRequestManager', requestManager)
  })

  afterAll(() => {
    document.body.innerHTML = ''
  })

  it('shows init cover at start', () => {
    expect(vm.$refs.chart.showInitCover).toBe(true)
    expect(vm.$refs.chart.showErrorCover).toBe(false)
    expect(vm.$refs.chart.showLoadingCover).toBe(false)
  })

  it('shows loading cover when running analysis', async done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve({data: {task_id: 123}}))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValue(Promise.resolve({data: {state: 'SUBMITTED', result: ''}}))
    vm.runAnalysis('some-task', {})
    await vm.__timeout(500)
    vm.$nextTick(() => {
      expect(Object.keys(vm.$data.__tasks).length).toBe(1)
      expect(vm.$refs.chart.showInitCover).toBe(false)
      expect(vm.$refs.chart.showErrorCover).toBe(false)
      expect(vm.$refs.chart.showLoadingCover).toBe(true)
      done()
    })
  })

  it('shows error cover when error occured', async done => {
    spyOn(store.getters.requestManager, 'createAnalysis')
      .and.returnValue(Promise.resolve({data: {task_id: 123}}))
    spyOn(store.getters.requestManager, 'getAnalysisStatus')
      .and.returnValue(Promise.resolve({data: {state: 'FAILURE', result: 'something went wrong'}}))
    vm.runAnalysis('some-task', {})
    await vm.__timeout(500)
    vm.$nextTick(() => {
      expect(Object.keys(vm.$data.__tasks).length).toBe(1)
      expect(vm.$refs.chart.showInitCover).toBe(false)
      expect(vm.$refs.chart.showLoadingCover).toBe(false)
      expect(vm.$refs.chart.showErrorCover).toBe(true)
      done()
    })
  })
})
