/**
 * Provides a mixin that allows the component to expose its parameters for getting and setting.
 */
import _ from 'lodash'

export default {
  data () {
    return {
      _paramPath: null,
      _parameterChangedCallback: () => {}
    }
  },
  methods: {
    registerParameterObjectInterface (path) {
      this.$data._paramPath = path
      this.$watch(path, newParams => {
        const paramCopy = _.cloneDeep(newParams)
        this.$data._parameterChangedCallback(paramCopy)
      }, {deep: true})
    },
    _setParameterChangedCallback (callback) {
      this.$data._parameterChangedCallback = callback
      const paramCopy = _.cloneDeep(_.get(this, this.$data._paramPath))
      callback(paramCopy)
    },
    _setParameters (params) {
      Object.keys(params).forEach(key => {
        _.set(this, [this.$data._paramPath, key, 'value'], params[key])
      })
    }
  }
}
