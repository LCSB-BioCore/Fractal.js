import store from './store/store'
import RequestManager from './services/request-manager'
import ChartManager from './services/chart-manager'

class FractalJS {
  constructor (handler, thisBaseURL, fractalisBaseURL, getAuth) {
    const requestManager = new RequestManager({handler, thisBaseURL, fractalisBaseURL, getAuth})
    store.dispatch('setRequestManager', requestManager)
    store.dispatch('updateData')
    this._chartManager = new ChartManager()
  }

  // noinspection JSMethodCanBeStatic
  loadData (descriptors) {
    return store.state.requestManager.createData({descriptors})
  }

  setChart ({chart, selector}) {
    this._chartManager.setChart({chart, selector})
  }

  // noinspection JSMethodCanBeStatic
  clearCache () {
    return store.state.requestManager.deleteAllData()
  }

  // noinspection JSMethodCanBeStatic
  setSubsets (...subsets) {
    store.dispatch('setSubsets', subsets)
  }

  // noinspection JSMethodCanBeStatic
  deleteSubsets () {
    store.dispatch('setSubsets', [])
  }
}

// TODO: Link to external documentation where supported services are listed
/**
 * Initialize FractalJS and return an instance that contains all basic methods necessary to use this library.
 *
 * @param handler: The service in which this library is used. Example: 'ada', 'tranSMART', 'variantDB'
 * @param thisBaseURL: The base URL of the service in which this library is used. Example: 'https://my.service.org/'
 * @param fractalisBaseURL: The base URL of the fractalis back end that you want to use. 'http://fractalis.uni.lu/'
 * @param getAuth: This MUST be a function that can be called at any time to retrieve credentials to authenticate with
 * the API of the service specified in thisBaseURL.
 * @returns {FractalJS}: An instance of FractalJS.
 */
export function init ({handler, thisBaseURL, fractalisBaseURL, getAuth}) {
  if (!handler) {
    throw new Error(`handler property must not be ${handler}`)
  }
  if (!thisBaseURL) {
    throw new Error(`handler property must not be ${thisBaseURL}`)
  }
  if (!fractalisBaseURL) {
    throw new Error(`handler property must not be ${fractalisBaseURL}`)
  }
  if (!getAuth) {
    throw new Error(`handler property must not be ${getAuth}`)
  }
  return new FractalJS(handler, thisBaseURL, fractalisBaseURL, getAuth)
}
