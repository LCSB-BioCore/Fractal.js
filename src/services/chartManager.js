import Vue from 'vue'
import CorrelationAnalysis from '../components/charts/CorrelationAnalysis.vue'

class ChartManager {
  setChart (name, elementId) {
    const charts = {'correlation-analysis': CorrelationAnalysis}
    const Chart = Vue.extend(charts[name])
    const vm = new Chart()
    vm.$mount(elementId)
  }
}

export { ChartManager }
