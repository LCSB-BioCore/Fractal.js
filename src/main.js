import { version } from '../package.json'
import store from './store/store'
import RequestManager from './services/request-manager'
import ChartManager from './services/chart-manager'
import StateManager from './services/state-manager'
require('./assets/fonts/Roboto/Roboto.sass')
require('./assets/fonts/MaterialIcons/MaterialIcons.sass')

class FractalJS {
  constructor (handler, dataSource, fractalisNode, getAuth, options) {
    const requestManager = new RequestManager(handler, dataSource, fractalisNode, getAuth)
    const chartManager = new ChartManager()
    const stateManager = new StateManager()
    store.dispatch('setRequestManager', requestManager)
    store.dispatch('setChartManager', chartManager)
    store.dispatch('setStateManager', stateManager)
    store.dispatch('updateData')
    store.dispatch('setOptions', options)
    this._versionCheck()
  }

  async _versionCheck () {
    const rv = await store.getters.requestManager.getVersion()
    const fractaljsVersions = version.split('.')
    const fractaljsMajor = fractaljsVersions[0]
    const fractaljsMinor = fractaljsVersions[1]
    const fractalisVersions = rv.data.version.split('.')
    const fractalisMajor = fractalisVersions[0]
    const fractalisMinor = fractalisVersions[1]
    if (fractaljsMajor !== fractalisMajor || fractaljsMinor !== fractalisMinor) {
      console.warn(`WARNING: The Fractalis backend is version ${rv.data.version},
      but the frontend is version ${version}. This might or might not cause issues.`)
    }
  }

  /**
   * Trigger ETL processes for the given list of descriptors to populate the data cache.
   * @param descriptors {[object]}. Descriptors that contain information for the ETLs. (Depends on ETL implementation).
   * @returns {promise}
   */
  loadData (descriptors) {
    return store.getters.requestManager.createData(descriptors)
  }

  /**
   * Put chart into a container identified by selector.
   * A list of charts can be obtained by {@link getAvailableCharts}.
   * IMPORTANT: Make sure that the container has a relative or fixed height/width (e.g. width: 10vw)
   * @param chart {string}
   * @param selector {string} CSS selector (of div that will contain the chart.)
   * @returns {Vue}
   */
  setChart (chart, selector) {
    return store.getters.chartManager.setChart(chart, selector)
  }

  /**
   * Remove all charts.
   * IMPORTANT: This does not remove the surrounding containers!
   */
  removeAllCharts () {
    store.getters.chartManager.removeAllCharts()
  }

  /**
   * Returns list of available charts types that can be used as arguments for {@link setChart}.
   * @returns {[string]}
   */
  getAvailableCharts () {
    return store.getters.chartManager.getAvailableCharts()
  }

  /**
   * Clear data cache.
   * @returns {promise}
   */
  clearCache () {
    return store.getters.requestManager.deleteAllData()
  }

  /**
   * Set list of lists of ids (subsets / cohorts) that will be applied to all charts.
   * Example: [caseGroupIds, controlGroupIds]
   * By default all ids are in one group.
   * @param subsets {[[number]]}
   */
  setSubsets (subsets) {
    store.dispatch('setSubsets', subsets)
  }

  /**
   * Undo all previous subset selections. {@link setSubsets}.
   */
  deleteSubsets () {
    store.dispatch('setSubsets', [])
  }

  // FIXME: temporarily disabled. Focus on stabilizing core functionality for now.
  // chart2id (vm, callback) {
  //   return store.getters.stateManager.chart2id(vm, callback)
  // }
  //
  // id2chart (selector, stateID) {
  //   return store.getters.stateManager.id2chart(selector, stateID)
  // }

  /**
   * For a given chart register a callback that accepts exactly one argument (the parameterDescriptionObject)
   * The callback is called every time the parameters of the chart change to reflect the current state of the parameters.
   * Example for parameterDescriptionObject with two described parameters `ignoreSubsets` and `method`:
   *
   * {
   *  ignoreSubsets: {
   *    label: 'Ignore Subsets',
   *    type: Boolean,
   *    value: true
   *   },
   *   method: {
   *    label: 'Correlation Method',
   *    type: String,
   *    validValues: ['pearson', 'kendall', 'spearman'],
   *    value: 'pearson'
   *   }
   * }
   *
   * For this chart `ignoreSubsets` and `method` are valid keys for the parameterObject in {@link setChartParameters}
   *
   * @param vm {Vue} The chart VM (returned by setChart)
   * @param callback {function} The callback to register.
   */
  getChartParameterDescriptions (vm, callback) {
    store.getters.chartManager.getChartParamDescr(vm, callback)
  }

  /**
   * Update the given vm with the given set of parameter names and their new value.
   *
   * The names of these parameters are the keys of the parameterDescriptionObject obtained at
   * {@link getChartParameterDescriptions}. E.g. in the example above `ignoreSubsets` and `method`.
   *
   * The values are constrained to the description given by the parameterDescriptionObject.
   * E.g. in the example above `ignoreSubsets` must be a Boolean and `method` must be a String amongst
   * the 3 valid values 'pearson', 'kendall', and 'spearman'
   *
   * Example for the parameters argument for this function:
   *
   * {
   *   method: 'spearman',
   *   ignoreSubsets: false
   * }
   *
   * @param vm {Vue} (returned by setChart)
   * @param parameters {object} (parameterName:parameterValue pairs)
   */
  setChartParameters (vm, parameters) {
    store.getters.chartManager.setChartParams(vm, parameters)
  }
}

/**
 * Initialize FractalJS and return an instance that contains all basic methods necessary to use this library.
 *
 * @param handler {string}: The service in which this library is used. Example: 'ada', 'tranSMART', 'variantDB'
 * @param dataSource {string}: The base URL of the service in which this library is used. Example: 'https://my.service.org/'
 * @param fractalisNode {string}: The base URL of the fractalis back end that you want to use. 'http://fractalis.uni.lu/'
 * @param getAuth {function}: This MUST be a function that can be called at any time to retrieve credentials to authenticate with
 * @param options {object}: Optional object to configure fractal.js within the target UI.
 * the API of the service specified in dataSource.
 * @returns {FractalJS}: An instance of FractalJS.
 */
export function init ({handler, dataSource, fractalisNode, getAuth, options}) {
  if (!handler) {
    throw new Error(`handler property must not be ${handler}`)
  }
  if (!dataSource) {
    throw new Error(`handler property must not be ${dataSource}`)
  }
  if (!fractalisNode) {
    throw new Error(`handler property must not be ${fractalisNode}`)
  }
  if (!getAuth) {
    throw new Error(`handler property must not be ${getAuth}`)
  }
  return new FractalJS(handler, dataSource, fractalisNode, getAuth, options)
}
