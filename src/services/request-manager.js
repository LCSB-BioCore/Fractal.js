import axios from 'axios'
import store from '../store/store'

export default class {
  constructor ({handler, thisBaseURL, fractalisBaseURL, getAuth}) {
    this._handler = handler
    this._thisBaseURL = thisBaseURL
    this._getAuth = getAuth

    this._axios = axios.create({
      baseURL: fractalisBaseURL,
      timeout: 10000,
      withCredentials: true
    })
  }

  createData ({descriptors}) {
    this._axios.post('/data', {
      descriptors,
      auth: this._getAuth(),
      handler: this._handler,
      server: this._thisBaseURL
    })
  }

  reloadData ({taskID}) {
    const dataItem = store.getters.data.find(d => d.task_id === taskID)
    const descriptors = [dataItem.descriptor]
    this.deleteData({taskID})
    this.createData({descriptors})
  }

  getAllDataStates () {
    return this._axios.get('/data')
  }

  deleteData ({taskID}) {
    return this._axios.delete(`/data/${taskID}`)
  }

  deleteAllData () {
    return this._axios.delete('/data')
  }

  createAnalysis ({task_name, args}) {
    return this._axios.post('/analytics', {task_name, args})
  }

  getAnalysisStatus ({taskID}) {
    return this._axios.get(`/analytics/${taskID}`)
  }

  cancelAnalysis ({taskID}) {
    store.dispatch('unsetTask', {taskID})
    return this._axios.delete(`/analytics/${taskID}`)
  }
}
