import Vue from 'vue'
import DataBox from '../src/vue/components/DataBox.vue'
import store from '../src/store/store'

describe('DataBox', () => {
  afterEach(() => {
    store.state.data = []
  })

  it('has correct name', () => {
    expect(DataBox.name).toBe('data-box')
  })

  it('renders 3 checkboxes for 3 elements in data', () => {
    store.state.data = [
      {data_type: 'numeric', label: ''},
      {data_type: 'numeric', label: ''},
      {data_type: 'numeric', label: ''}
    ]
    const Component = Vue.extend(DataBox)
    const propsData = {dataType: 'numeric', header: ''}
    const vm = new Component({propsData}).$mount()
    expect(vm.$el.querySelectorAll('.fjs-data-entry-header').length).toBe(3)
  })

  it('only renders checkboxes for data with correct type', () => {
    store.state.data = [
      {data_type: 'numeric', label: ''},
      {data_type: 'categoric', label: ''}
    ]
    const Component = Vue.extend(DataBox)
    const propsData = {dataType: 'numeric', header: ''}
    const vm = new Component({propsData}).$mount()
    expect(vm.$el.querySelectorAll('.fjs-data-entry-header').length).toBe(1)
  })

  it('checkboxes are linked to data', () => {
    store.state.data = [
      {data_type: 'numeric', label: '', task_id: 'A', etl_state: 'SUCCESS'},
      {data_type: 'numeric', label: '', task_id: 'B', etl_state: 'SUCCESS'}
    ]
    const Component = Vue.extend(DataBox)
    const propsData = {dataType: 'numeric', header: ''}
    const data = {selectedIDs: ['A']}
    const vm = new Component({propsData, data}).$mount()
    expect(vm.$el.querySelectorAll('.fjs-data-entry-header').length).toBe(2)
    expect(vm.$el.querySelector('.fjs-data-entry-header input[data-id="A"]').checked).toBeTruthy()
    expect(vm.$el.querySelector('.fjs-data-entry-header input[data-id="B"]').checked).toBeFalsy()
  })

  afterAll(() => {
    document.body.innerHTML = ''
  })
})
