import store from '../store/store'

export default class {
  getChartElementForSelector (selector) {
    let chartElement = document.querySelectorAll(selector)
    if (chartElement.length !== 1) {
      throw new Error('The given selector must point to exactly one element. ' +
        '#Elements for this selector: ' + chartElement.length)
    }
    chartElement = chartElement[0]
    if (typeof chartElement.__vue__ === 'undefined' || chartElement.__vue__.$options.name !== 'chart') {
      throw new Error('The given selector must point to a div element with class "fjs-chart". ' +
        'This is the div that replaced the placeholder when creating the chart initially.')
    }
    return chartElement
  }

  chart2id (selector, callback) {
    const chartElement = this.getChartElementForSelector(selector)
    chartElement.__vue__.$parent._setStateChangedCallback(async function (name, state) {
      const rv = await store.getters.requestManager.saveState({chartName: name, chartState: state})
      const stateID = rv.data.state_id
      callback(stateID)
    })
  }

  async getState (stateID) {
    function timeout (ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
    await store.getters.requestManager.requestStateAccess(stateID)
    let timeWaited = 0
    let delay = 200
    while (timeWaited <= 900000) {  // we wait 15 minutes
      await timeout(delay)
      timeWaited += delay
      delay += 100
      delay = delay > 3000 ? 3000 : delay
      const rv = await store.getters.requestManager.getState(stateID)
      if (rv.status === 200) {
        return rv.data.state
      }
    }
  }

  async id2chart (selector, stateID) {
    const state = await this.getState(stateID)
    const vm = store.getters.chartManager.setChart(state.chartName, selector)
    vm._setState(state.chartState)
  }
}
