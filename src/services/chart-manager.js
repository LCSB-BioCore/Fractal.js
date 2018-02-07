import Vue from 'vue'
import CorrelationAnalysis from '../vue/charts/CorrelationAnalysis.vue'
import Boxplot from '../vue/charts/Boxplot.vue'
import Heatmap from '../vue/charts/Heatmap.vue'
import PCA from '../vue/charts/PCA.vue'

export default class {
  constructor () {
    this.AVAILABLE_CHARTS = {
      [CorrelationAnalysis.name]: CorrelationAnalysis,
      [Boxplot.name]: Boxplot,
      [Heatmap.name]: Heatmap,
      [PCA.name]: PCA
    }
  }

  setChart (chart, selector) {
    if (!this.AVAILABLE_CHARTS.hasOwnProperty(chart)) {
      throw new Error(`Chart '${chart} is not available. Must be one of: ${this.AVAILABLE_CHARTS}`)
    }
    let container = document.querySelectorAll(selector)
    if (container.length !== 1) {
      throw new Error(`Selector to set a chart must match exactly one element. Matched elements: ${container.length}`)
    }
    container = container[0]
    const Chart = Vue.extend(this.AVAILABLE_CHARTS[chart])
    const vm = new Chart()
    const el = document.createElement('div')
    container.appendChild(el)
    vm.$mount(el)
    return vm
  }
}
