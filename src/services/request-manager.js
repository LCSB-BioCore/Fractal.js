import axios from 'axios'

/**
 * The RequestManager class is responsible for the communication with the back end.
 * All atomic API calls are present here and only here.
 * This class uses axios for AJAX calls.
 *{
 * Note: You should avoid calling the RequestManager methods directly.
 * Instead use the provided helpers available as mixins.
 */
export default class {
  constructor (handler, dataSource, fractalisNode, getAuth) {
    this._handler = handler
    this._dataSource = dataSource
    this._getAuth = getAuth

    this._axios = axios.create({
      baseURL: fractalisNode,
      timeout: 30000,
      withCredentials: true
    })
  }

  /**
   * Submit a POST request that will trigger matching ETLs in the back end.
   * The request returns nothing, but sets a session cookie which grants the necessary permission
   * to work with the submitted data.
   * @param descriptors An array of one or more objects that describe the data to be downloaded.
   * @returns {AxiosPromise} An ES6 promise.
   */
  createData (descriptors) {
    return this._axios.post('/data', {
      descriptors,
      auth: this._getAuth(),
      handler: this._handler,
      server: this._dataSource
    })
  }

  /**
   * A combination of deleteData and createData to simulate reload functionality.
   * @param taskID The data taskID to be reloaded.
   * @returns {AxiosPromise} An ES6 promise.
   */
  async reloadData (taskID) {
    const metaData = await this.getMetaData(taskID)
    const descriptors = [metaData.data.meta['descriptor']]
    await this.deleteData(taskID)
    return this.createData(descriptors)
  }

  /**
   * Submits a GET request that will return meta information of all data available in the current session.
   * @returns {AxiosPromise} An ES6 promise.
   * */
  getAllDataStates () {
    return this._axios.get('/data')
  }

  /**
   * Submits a GET request that will return meta information for the data associated with the given task id.
   * @param taskID to get meta information for.
   * @returns {AxiosPromise} An ES6 promise.
   */
  getMetaData (taskID) {
    return this._axios.get(`/data/meta/${taskID}`)
  }

  /**
   * Submits a DELETE request that will remove data from the back end if the current session has access to it.
   * @param taskID The id of the data to be removed.
   * @returns {AxiosPromise} An ES6 promise.
   */
  deleteData (taskID) {
    return this._axios.delete(`/data/${taskID}`)
  }

  /**
   * Submits a DELETE requests that will wipe all data from the back end associated with the session.
   * @returns {AxiosPromise}
   */
  deleteAllData () {
    return this._axios.delete('/data')
  }

  /**
   * Submits a POST request that will launch an analysis for the given parameters.
   * The returned promise will resolve into the taskID, which can be used to check the status of the task.
   * @param taskName The name of the task to submit.
   * @param args The arguments of the task.
   * @returns {AxiosPromise} An ES6 promise.
   */
  createAnalysis (taskName, args) {
    return this._axios.post('/analytics', {task_name: taskName, args})
  }

  /**
   * Submits a GET request that will return the status for the given id.
   * @param taskID The id of the task.
   * @returns {AxiosPromise} An ES6 promise.
   */
  getAnalysisStatus (taskID) {
    return this._axios.get(`/analytics/${taskID}`)
  }

  /**
   * Submits a DELETE request that will attempt to cancel an already submitted task.
   * @param taskID The id of the task.
   * @returns {AxiosPromise} An ES6 promise.
   */
  cancelAnalysis (taskID) {
    return this._axios.delete(`/analytics/${taskID}`)
  }

  /**
   * Submits a GET request to retrieve the fractalis backend version.
   * @returns {AxiosPromise} An ES6 promise.
   */
  getVersion () {
    return this._axios.get('/misc/version')
  }

  /**
   * Submits a POST request to save the specified sate object in the Fractalis backend.
   * @param state An arbitrary JS object that represents the chart state to save.
   * @returns {AxiosPromise} An ES6 promise.
   */
  saveState (state) {
    return this._axios.post('/state', {
      state,
      handler: this._handler,
      server: this._dataSource
    })
  }

  /**
   * Submits a POST request to request access for a given state. The response body will be
   * empty because this is an async. operation. The result will be made available via GET
   * request to the same URL.
   * @param stateID The id returned by the POST request to /state.
   * @returns {AxiosPromise} An ES6 promise.
   */
  requestStateAccess (stateID) {
    return this._axios.post(`/state/${stateID}`, {
      auth: this._getAuth()
    })
  }

  /**
   * Submits a GET request to get the state if access has been granted.
   * @param stateID The id returned by the POST request to /state.
   * @returns {AxiosPromise} An ES6 promise.
   */
  getState (stateID) {
    return this._axios.get(`/state/${stateID}`)
  }
}
