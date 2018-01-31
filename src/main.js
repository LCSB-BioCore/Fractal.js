import {version} from '../package.json'
import store from './store/store'
import RequestManager from './services/request-manager'
import ChartManager from './services/chart-manager'
import StateManager from './services/state-manager'

class FractalJS {
  constructor (handler, dataSource, fractalisNode, getAuth, options) {
    const requestManager = new RequestManager({handler, dataSource, fractalisNode, getAuth})
    store.dispatch('setRequestManager', requestManager)
    store.dispatch('updateData')
    store.dispatch('setOptions', options)
    this._chartManager = new ChartManager()
    this._stateManager = new StateManager()
    this._versionCheck()
  }

  // noinspection JSMethodCanBeStatic
  async _versionCheck () {
    const rv = await store.state.requestManager.getVersion()
    const backendVersion = rv.data.version
    if (backendVersion !== version) {
      console.warn(`WARNING: The Fractalis backend is version ${backendVersion},
      but the frontend is version ${version}. This might or might not cause issues.`)
    }
  }

  // noinspection JSMethodCanBeStatic
  loadData (descriptors) {
    return store.state.requestManager.createData({descriptors})
  }

  setChart ({chart, selector}) {
    return this._chartManager.setChart({chart, selector})
  }

  // noinspection JSMethodCanBeStatic
  clearCache () {
    return store.state.requestManager.deleteAllData()
  }

  // noinspection JSMethodCanBeStatic
  setSubsets (subsets) {
    store.dispatch('setSubsets', subsets)
  }

  // noinspection JSMethodCanBeStatic
  deleteSubsets () {
    store.dispatch('setSubsets', [])
  }

  // noinspection JSMethodCanBeStatic
  chart2uri (selector) {
    return this._stateManager.chart2uri(selector)
  }

  // noinspection JSMethodCanBeStatic
  uri2chart (selector, uri) {
    return this._stateManager.uri2chart(selector, uri)
  }
}

// TODO: Link to external documentation where supported services are listed
/**
 * Initialize FractalJS and return an instance that contains all basic methods necessary to use this library.
 *
 * @param handler: The service in which this library is used. Example: 'ada', 'tranSMART', 'variantDB'
 * @param dataSource: The base URL of the service in which this library is used. Example: 'https://my.service.org/'
 * @param fractalisNode: The base URL of the fractalis back end that you want to use. 'http://fractalis.uni.lu/'
 * @param getAuth: This MUST be a function that can be called at any time to retrieve credentials to authenticate with
 * the API of the service specified in dataSource.
 * @returns {FractalJS}: An instance of FractalJS.
 */
export function init ({handler, dataSource, fractalisNode, getAuth, options}) {
  return new FractalJS(handler, dataSource, fractalisNode, getAuth, options)
}
