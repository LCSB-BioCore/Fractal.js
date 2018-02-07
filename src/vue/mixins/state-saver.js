/**
 * Provide a mixin that allows the component to register certain parts of their state to be saved.
 * The only "public" method is registerDataToSave which takes a list strings (paths) representing
 * paths in the component data.
 */

import objectPath from 'object-path'

export default {
  data () {
    return {
      _dataToSave: [],
      _callback: () => {}
    }
  },
  methods: {
    registerDataToSave (list) {
      this.$data._dataToSave = list
      list.forEach(path => {
        this.$watch(path, () => {
          this.$data._callback(this.$options.name, this._savedState)
        }, {deep: true})
      })
    },
    _setState (state) {
      Object.assign(this.$data, state)
    },
    _setStateChangedCallback (callback) {
      this.$data._callback = callback
    }
  },
  computed: {
    _savedState () {
      const state = {}
      this.$data._dataToSave.forEach(path => {
        objectPath.ensureExists(state, path, objectPath.get(this.$data, path))
      })
      return state
    }
  }
}
