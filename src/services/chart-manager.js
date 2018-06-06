import Vue from 'vue'
import Scatterplot from '../vue/charts/Scatterplot.vue'
import Boxplot from '../vue/charts/Boxplot.vue'
import Volcanoplot from '../vue/charts/Volcanoplot.vue'
import Heatmap from '../vue/charts/Heatmap.vue'
import PCA from '../vue/charts/PCA.vue'

export default class {
  constructor () {
    this.AVAILABLE_CHARTS = {
      [Scatterplot.name]: Scatterplot,
      [Boxplot.name]: Boxplot,
      [Heatmap.name]: Heatmap,
      [PCA.name]: PCA,
      [Volcanoplot.name]: Volcanoplot
    }
  }

  /**
   * Attempts to set a chart based on a given name as a child of the given selector.
   * @param chart: The name of the chart. Must be a name of a vue component within AVAILABLE_CHARTS.
   * @param selector: A unique selector which will be the parent of the chart.
   * @returns {Vue} The mounted vue component.
   */
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
