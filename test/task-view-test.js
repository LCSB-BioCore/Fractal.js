import TaskView from '../src/vue/components/TaskView.vue'
import store, { _resetState } from '../src/store/store'
import Vue from 'vue'
import RequestManager from '../src/services/request-manager'

describe('TaskView', () => {
  let vm
  beforeEach(() => {
    _resetState()
    const requestManager = new RequestManager(
      {handler: '', dataSource: '', fractalisNode: '', getAuth: () => {}})
    store.dispatch('setRequestManager', requestManager)
    const Component = Vue.extend(TaskView)
    vm = new Component().$mount()
  })

  it('shows all SUBMITTED or FAILED tasks in store', done => {
    Promise.all([
      store.dispatch('setTask', {taskID: 1, taskName: 'A', taskState: 'SUBMITTED'}),
      store.dispatch('setTask', {taskID: 2, taskName: 'B', taskState: 'SUCCESS'}),
      store.dispatch('setTask', {taskID: 3, taskName: 'C', taskState: 'SUBMITTED'}),
      store.dispatch('setTask', {taskID: 4, taskName: 'D', taskState: 'FAILURE'}),
      store.dispatch('setTask', {taskID: 5, taskName: 'E', taskState: 'YAY'}),
      store.dispatch('setTask', {taskID: 6, taskName: 'F', taskState: 'PENDING'})
    ]).then(() => {
      Vue.nextTick(() => {
        expect(Object.keys(store.getters.tasks).length).toBe(6)
        expect(vm.$el.querySelectorAll('.fjs-state-container').length).toBe(3)
        expect(vm.$el.querySelectorAll('.fjs-submitted').length).toBe(2)
        expect(vm.$el.querySelectorAll('.fjs-failed').length).toBe(1)
        done()
      })
    })
  })

  it('cancel button works', done => {
    Promise.all([
      store.dispatch('setTask', {taskID: 1, taskName: 'A', taskState: 'SUBMITTED'}),
      store.dispatch('setTask', {taskID: 2, taskName: 'B', taskState: 'FAILURE'})
    ]).then(() => {
      Vue.nextTick(() => {
        expect(Object.keys(store.getters.tasks).length).toBe(2)
        expect(vm.$el.querySelectorAll('.fjs-state-container').length).toBe(2)
        vm.$el.querySelectorAll('.fjs-cancel-btn').forEach(button => button.click())
        Vue.nextTick(() => {
          expect(Object.keys(store.getters.tasks).length).toBe(0)
          expect(vm.$el.querySelectorAll('.fjs-state-container').length).toBe(0)
          done()
        })
      })
    })
  })
})
