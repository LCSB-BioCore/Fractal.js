import store from './store/store'
import RequestManager from './services/request-manager'
import ChartManager from './services/chart-manager'

class FractalJS {
  constructor (handler, thisBaseURL, fractalisBaseURL, getAuth) {
    const requestManager = new RequestManager(
      {handler, thisBaseURL, fractalisBaseURL, getAuth})
    store.dispatch('setRequestManager', requestManager)
    this._chartManager = new ChartManager()
  }

  // noinspection JSMethodCanBeStatic
  loadData (descriptors) {
    store.requestManager.createData(descriptors)
  }

  setChart (name, elementId) {
    this._chartManager.setChart({name, elementId})
  }

  // noinspection JSMethodCanBeStatic
  setSubsets (...subsets) {
    store.dispatch('setSubsets', subsets)
  }
}

export function init ({handler, thisBaseURL, fractalisBaseURL, getAuth} = {}) {
  return new FractalJS(handler, thisBaseURL, fractalisBaseURL, getAuth)
}
