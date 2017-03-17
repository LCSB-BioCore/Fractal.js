import axios from 'axios'

export default class {
  _validateHandler (handler) {

  }

  _validateServerURL (thisServerURL) {

  }

  _validateAuth (thisAuth) {

  }

  constructor (handler, thisBaseURL, thisAuth, fractalisBaseURL) {
    this._validateHandler(handler)
    this._validateServerURL(thisBaseURL)
    this._validateAuth(thisAuth)
    this._validateServerURL(fractalisBaseURL)

    this._handler = handler
    this._thisBaseURL = thisBaseURL
    this._thisAuth = thisAuth

    this._axios = axios.create({
      baseURL: fractalisBaseURL,
      timeout: 1000
    })
  }

  createData (descriptors) {
    this._axios.post('/data', {
      handler: this._handler,
      server: this._thisBaseURL,
      auth: this._thisAuth,
      descriptors
    }).then(response => {
      console.log(response)
    }).catch(error => {
      console.log(error)
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
    this._axios.get('/data').then(response => {
      console.log(response)
    }).else(error => {
      console.log(error)
    })
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
