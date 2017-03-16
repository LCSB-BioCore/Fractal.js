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

    this.handler = handler
    this.thisBaseURL = thisBaseURL
    this.thisAuth = thisAuth
    this.fractalisBaseURL = fractalisBaseURL
  }

  loadData (descriptors) {
    axios.post('/data', {
      handler: this.handler,
      server: this.server,
      auth: this.auth,
      descriptors,
    }).then(response => {
      console.log(response)
    }).catch(error => {
      console.log(error)
    })
  }
}
