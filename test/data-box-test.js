import Vue from 'vue'
import DataBox from '../src/vue/components/DataBox.vue'
import store, { resetState } from '../src/store/store'

describe('DataBox', () => {
  afterEach(() => {
    resetState()
  })

  it('has correct name', () => {
    expect(DataBox.name).toBe('data-box')
  })

  it('renders 3 checkboxes for 3 elements in data', () => {
    store.state.data = [
      {data_type: 'numeric', label: '', etl_state: 'SUCCESS'},
      {data_type: 'numeric', label: '', etl_state: 'SUCCESS'},
      {data_type: 'numeric', label: '', etl_state: 'SUCCESS'}
    ]
    const Component = Vue.extend(DataBox)
    const propsData = {dataTypes: ['numeric'], header: ''}
    const vm = new Component({propsData}).$mount()
    expect(vm.$el.querySelectorAll('.fjs-item-head').length).toBe(3)
  })

  it('only renders checkboxes for data with correct type', () => {
    store.state.data = [
      {data_type: 'numeric', label: '', etl_state: 'SUCCESS'},
      {data_type: 'categoric', label: '', etl_state: 'SUCCESS'}
    ]
    const Component = Vue.extend(DataBox)
    const propsData = {dataTypes: ['numeric'], header: ''}
    const vm = new Component({propsData}).$mount()
    expect(vm.$el.querySelectorAll('.fjs-item-head').length).toBe(1)
  })

  it('checkboxes are linked to data', () => {
    store.state.data = [
      {data_type: 'numeric', label: '', task_id: 'A', etl_state: 'SUCCESS'},
      {data_type: 'numeric', label: '', task_id: 'B', etl_state: 'SUCCESS'}
    ]
    const Component = Vue.extend(DataBox)
    const propsData = {dataTypes: ['numeric'], header: ''}
    const data = {checkedIds: ['A']}
    const vm = new Component({propsData, data}).$mount()
    expect(vm.$el.querySelectorAll('.fjs-item-head').length).toBe(2)
    expect(vm.$el.querySelector('.fjs-item-head input[value="A"]').checked).toBeTruthy()
    expect(vm.$el.querySelector('.fjs-item-head input[value="B"]').checked).toBeFalsy()
  })

  it('only shows data with state SUCCESS/FAILURE/SUBMITTED', () => {
    store.state.data = [
      {data_type: 'numeric', label: '', task_id: 'A', etl_state: 'SUCCESS'},
      {data_type: 'numeric', label: '', task_id: 'B', etl_state: 'FAILURE'},
      {data_type: 'numeric', label: '', task_id: 'C', etl_state: 'SUBMITTED'},
      {data_type: 'numeric', label: '', task_id: 'D', etl_state: 'PENDING'},
      {data_type: 'numeric', label: '', task_id: 'E', etl_state: 'FOO'}
    ]
    const Component = Vue.extend(DataBox)
    const propsData = {dataTypes: ['numeric'], header: ''}
    const vm = new Component({propsData}).$mount()
    expect(vm.$el.querySelectorAll('.fjs-item-head').length).toBe(3)
  })

  afterAll(() => {
    document.body.innerHTML = ''
  })
})
