import Vue from 'vue'
import TestChart from '../components/charts/test-chart.vue'
import CorrelationAnalysis from '../components/charts/correlation-analysis.vue'

export default class {
  constructor () {
    this.AVAILABLE_CHARTS = {
      [TestChart.name]: TestChart,
      [CorrelationAnalysis.name]: CorrelationAnalysis
    }
  }

  setChart ({chart, selector}) {
    if (!this.AVAILABLE_CHARTS.hasOwnProperty(chart)) {
      throw Error(`Chart '${chart} is not available. Must be one of: ${this.AVAILABLE_CHARTS}`)
    }
    const Chart = Vue.extend(this.AVAILABLE_CHARTS[chart])
    const vm = new Chart()
    vm.$mount(selector)
  }

  removeChart ({elementId}) {
    // TODO: Implement
  }
}
