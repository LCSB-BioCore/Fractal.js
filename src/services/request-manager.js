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
    return this._axios.post('/data', {
      descriptors,
      auth: this._getAuth(),
      handler: this._handler,
      server: this._thisBaseURL
    })
  }

  reloadData ({dataID}) {
    const dataItem = store.getters.data.find(d => d.data_id === dataID)
    const descriptors = [dataItem.descriptor]
    this.createData({descriptors})
  }

  getDataStatusByParams ({descriptor}) {
    const params = JSON.stringify({server: this._thisBaseURL, descriptor})
    return this._axios.get(`/data/${params}`)
  }

  getDataStatusByID ({dataID}) {
    return this._axios.get(`/data/${dataID}`)
  }

  getAllDataStatus () {
    return this._axios.get('/data')
  }

  deleteData ({dataID}) {
    return this._axios.delete(`/data/${dataID}`)
  }

  deleteAllData () {
    return this._axios.delete('/data')
  }

  createAnalysis ({job_name, args}) {
    return this._axios.post('/analytics', {job_name, args})
  }

  getAnalysisStatus ({jobID}) {
    return this._axios.get(`/analytics/${jobID}`)
  }

  cancelAnalysis ({jobID}) {
    return this._axios.delete(`/analytics/${jobID}`)
  }
}
