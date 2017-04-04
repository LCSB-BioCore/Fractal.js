import Vue from 'vue'
import DataBox from '../src/components/DataBox.vue'
import store from '../src/store/store'

describe('DataBox', () => {
  beforeEach(() => {
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
    const vm = new Component({dataType: 'numeric'}).$mount()
    expect(vm.$el.querySelectorAll('input[type="checkbox"]').length).toBe(3)
  })
})
