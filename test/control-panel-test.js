import ControlPanel from '../src/vue/components/ControlPanel.vue'
import Vue from 'vue'
import store, { resetState } from '../src/store/store'

describe('ControlPanel', () => {
  let vm
  beforeEach(() => {
    resetState()
    const div1 = document.createElement('div')
    div1.id = 'div1'
    const div2 = document.createElement('div')
    div2.id = 'div2'
    document.body.appendChild(div1)
    document.body.appendChild(div2)
    const Component = Vue.extend(ControlPanel)
    vm = new Component({propsData: {name: 'foo'}}).$mount('#div1')
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('is not locked initially', () => {
    expect(vm.lockIcon).toBe('lock_open')
    expect(vm.locked).toBeFalsy()
  })

  it('is locked if other panel is locked', () => {
    const Component = Vue.extend(ControlPanel)
    const _vm = new Component({propsData: {name: 'foo'}}).$mount('#div2')
    _vm.$el.querySelector('.fjs-lock-btn').click()
    Vue.nextTick(() => {
      expect(vm.lockIcon).toBe('lock')
      expect(vm.locked).toBeTruthy()
    })
  })

  it('is not expanded initially', () => {
    expect(vm.expanded).toBeFalsy()
  })

  it('is expanded if other panel is expanded', () => {
    const Component = Vue.extend(ControlPanel)
    const _vm = new Component({propsData: {name: 'foo'}}).$mount('#div2')
    expect(_vm.expanded).toBeFalsy()
    expect(vm.expanded).toBeFalsy()
    _vm.show()
    Vue.nextTick(() => {
      expect(_vm.expanded).toBeTruthy()
      expect(vm.expanded).toBeTruthy()
    })
  })

  it('adapts width when expanded state changes', () => {
    expect(vm.width).toBe('1vw')
    store.dispatch('setControlPanel', {expanded: true})
    Vue.nextTick(() => {
      expect(vm.width).toBe('15vw')
    })
  })

  it('expands when show() is called and not locked', () => {
    expect(vm.expanded).toBeFalsy()
    expect(vm.locked).toBeFalsy()
    vm.show()
    Vue.nextTick(() => {
      expect(vm.expanded).toBeTruthy()
      expect(vm.locked).toBeFalsy()
    })
  })

  it('does not expand when show() is called and locked', () => {
    expect(vm.locked).toBeFalsy()
    expect(vm.expanded).toBeFalsy()
    vm.toggleLock()
    vm.show()
    Vue.nextTick(() => {
      expect(vm.locked).toBeTruthy()
      expect(vm.expanded).toBeFalsy()
    })
  })

  it('collapses when hide() is called and not locked', () => {
    vm.show()
    Vue.nextTick(() => {
      expect(vm.expanded).toBeTruthy()
      expect(vm.locked).toBeFalsy()
      vm.hide()
      Vue.nextTick(() => {
        expect(vm.expanded).toBeFalsy()
      })
    })
  })

  it('does not collapse when hide() is called and locked', () => {
    vm.show()
    vm.toggleLock()
    Vue.nextTick(() => {
      expect(vm.expanded).toBeTruthy()
      expect(vm.locked).toBeTruthy()
      vm.hide()
      Vue.nextTick(() => {
        expect(vm.expanded).toBeTruthy()
      })
    })
  })

  it('new panel has auto focus', () => {
    const Component = Vue.extend(ControlPanel)
    const _vm = new Component({propsData: {name: 'foo'}}).$mount('#div2')
    expect(vm.focused).toBeFalsy()
    expect(_vm.focused).toBeTruthy()
  })
})
