import Vue from 'vue'
import _ from 'lodash'

export default class {
  constructor () {
    this.setCharts = []
    this.availableCharts = {}
    const req = require.context('../vue/charts/', true, /\.vue$/)
    req.keys().forEach(key => {
      const vm = req(key).default
      this.availableCharts[vm.name] = vm
    })
  }

  /**
   * Attempts to set a chart based on a given name as a child of the given selector.
   * @param chart: The name of the chart. Must be a name of a vue component within availableCharts.
   * @param selector: A unique selector which will be the parent of the chart.
   * @returns {Vue} The mounted vue component.
   */
  setChart (chart, selector) {
    if (!this.availableCharts.hasOwnProperty(chart)) {
      throw new Error(`Chart '${chart} is not available. Must be one of: ${this.availableCharts}`)
    }
    let container = document.querySelectorAll(selector)
    if (container.length !== 1) {
      throw new Error(`Selector to set a chart must match exactly one element. Matched elements: ${container.length}`)
    }
    container = container[0]
    const Chart = Vue.extend(this.availableCharts[chart])
    const vm = new Chart()
    const el = document.createElement('div')
    container.appendChild(el)
    vm.$mount(el)
    this.setCharts.push(vm)
    return vm
  }

  removeAllCharts () {
    this.setCharts.forEach(vm => {
      vm.$el.remove()
      vm.$destroy()
    })
    this.setCharts = []
  }

  getAvailableCharts () {
    return Object.keys(this.availableCharts)
  }

  getChartParamDescr (vm) {
    if (typeof vm.params === 'undefined') {
      throw new Error('This chart does not expose any parameters. This is a bug that you should report.')
    }
    return _.cloneDeep(vm.params)
  }

  setChartParameter (vm, params) {
    Object.keys(params).forEach(key => {
      if (typeof vm.params[key] === 'undefined') {
        throw new Error(`Parameter "${key}" does not exist for this chart.`)
      }
      vm.params[key].value = params[key]
    })
  }
}
