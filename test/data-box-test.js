import Vue from 'vue'
import DataBox from '../src/components/DataBox.vue'
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
      {dataType: 'numeric', description: ''},
      {dataType: 'numeric', description: ''},
      {dataType: 'numeric', description: ''}
    ]
    const Component = Vue.extend(DataBox)
    const propsData = {dataType: 'numeric'}
    const vm = new Component({propsData}).$mount()
    expect(vm.$el.querySelectorAll('.data-item').length).toBe(3)
  })

  it('only renders checkboxes for data with correct type', () => {
    store.state.data = [
      {dataType: 'numeric', description: ''},
      {dataType: 'categoric', description: ''},
    ]
    const Component = Vue.extend(DataBox)
    const propsData = {dataType: 'numeric'}
    const vm = new Component({propsData}).$mount()
    expect(vm.$el.querySelectorAll('.data-item').length).toBe(1)
  })

  it('checkboxes are linked to data', () => {
    store.state.data = [
      {dataType: 'numeric', description: 'A'},
      {dataType: 'numeric', description: 'B'},
    ]
    const Component = Vue.extend(DataBox)
    const propsData = {dataType: 'numeric'}
    const data = {checkedItems: ['A']}
    const vm = new Component({propsData, data}).$mount()
    expect(vm.$el.querySelectorAll('.data-item').length).toBe(2)
    expect(vm.$el.querySelector('#data-check-0').checked).toBeTruthy()
    expect(vm.$el.querySelector('#data-check-1').checked).toBeFalsy()
  })
})
