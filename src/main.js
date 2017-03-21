import 'babel-polyfill'
import { store } from './store'
import { RequestManager } from './services/requestManager'
import { ChartManager } from './services/chartManager'

class FractalJS {
  constructor (handler, thisBaseURL, fractalisBaseURL, getAuth) {
    const requestManager = new RequestManager(
      {handler, thisBaseURL, fractalisBaseURL, getAuth})
    store.dispatch('setRequestManager', requestManager)
    this._chartManager = new ChartManager()
  }

  static loadData (descriptors) {
    store.requestManager.createData(descriptors)
  }

  static setChart (name, elementId) {
    this._chartManager.setChart({name, elementId})
  }

  static setSubsets (...subsets) {
    store.dispatch('setSubsets', subsets)
  }
}

export function init ({handler, thisBaseURL, fractalisBaseURL, getAuth} = {}) {
  return new FractalJS(handler, thisBaseURL, fractalisBaseURL, getAuth)
}
