import axios from 'axios'

export default class {
  constructor ({handler, thisBaseURL, fractalisBaseURL, getAuth}) {
    this._handler = handler
    this._thisBaseURL = thisBaseURL
    this._getAuth = getAuth

    this._axios = axios.create({
      baseURL: fractalisBaseURL,
      timeout: 1000
    })
  }

  createData (descriptors) {
    return this._axios.post('/data', {
      descriptors,
      auth: this._getAuth(),
      handler: this._handler,
      server: this._thisBaseURL
    })
  }

  getDataStatusByParams (descriptor) {
    const params = JSON.stringify({server: this._thisBaseURL, descriptor})
    this._axios.get(`/data/${params}`).then(response => {
      console.log(response)
    }).else(error => {
      console.log(error)
    })
  }

  getDataStatusByID (dataID) {
    this._axios.get(`/data/${dataID}`).then(response => {
      console.log(response)
    }).else(error => {
      console.log(error)
    })
  }

  getAllDataStatus () {
    return this._axios.get('/data')
  }

  creareAnalysis (name, args) {
    this._axios.post('/analytics', {
      name,
      args
    }).then(response => {
      console.log(response)
    }).catch(error => {
      console.log(error)
    })
  }

  getAnalysisStatus (jobID) {
    this._axios.get(`/analytics/${jobID}`).then(response => {
      console.log(response)
    }).else(error => {
      console.log(error)
    })
  }

  cancelAnalysis (jobID) {
    this._axios.delete(`/analytics/${jobID}`).then(response => {
      console.log(response)
    }).else(error => {
      console.log(error)
    })
  }
}