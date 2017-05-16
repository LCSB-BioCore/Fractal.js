import Vue from 'vue'
import CorrelationAnalysis from '../components/charts/CorrelationAnalysis.vue'

export default class {
  constructor () {
    this.AVAILABLE_CHARTS = {
      [CorrelationAnalysis.name]: CorrelationAnalysis
    }
  }

  setChart ({chart, selector}) {
    if (!this.AVAILABLE_CHARTS.hasOwnProperty(chart)) {
      throw new Error(`Chart '${chart} is not available. Must be one of: ${this.AVAILABLE_CHARTS}`)
    }
    const Chart = Vue.extend(this.AVAILABLE_CHARTS[chart])
    const vm = new Chart()
    vm.$mount(selector)
  }

  removeChart ({elementId}) {
    // TODO: Implement
  }
}
