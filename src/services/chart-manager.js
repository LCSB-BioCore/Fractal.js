import Vue from 'vue'
import CorrelationAnalysis from '../components/charts/correlation-analysis.vue'

export default class {
  constructor () {
    this.AVAILABLE_CHARTS = {
      'correlation-analysis': CorrelationAnalysis
    }
  }

  setChart ({name, elementId} = {}) {
    if (Object.keys(this.AVAILABLE_CHARTS).indexOf(name) === -1) {
      throw Error(`Chart '${name} is not available. 
      Must be one of: ${this.AVAILABLE_CHARTS}`)
    }
    const Chart = Vue.extend(this.AVAILABLE_CHARTS[name])
    const vm = new Chart()
    vm.$mount(elementId)
  }
}
