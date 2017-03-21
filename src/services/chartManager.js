import Vue from 'vue'
import CorrelationAnalysis from '../components/charts/CorrelationAnalysis.vue'

class ChartManager {
  constructor () {
    this.AVAILABLE_CHARTS = {
      'correlation-analysis': CorrelationAnalysis
    }
  }

  setChart ({name, elementId} = {}) {
    if (this.AVAILABLE_CHARTS.indexOf(name) === -1) {
      throw Error(`Chart '${name} is not available. 
      Must be one of: ${this.AVAILABLE_CHARTS}`)
    }
    const Chart = Vue.extend(this.AVAILABLE_CHARTS[name])
    const vm = new Chart()
    vm.$mount(elementId)
  }
}

export { ChartManager }