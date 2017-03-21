import ReqestHandler from '../src/services/requestManager'

describe('RequestHandler', () => {
  it('throws if invalid constructor arguments 1', () => {
    const params = {
      handler: 'foo',
      thisBaseURL: 'http://localhost:5000',
      thisAuth: {token: '1234567890'},
      fractalisBaseURL: 'http://fractalis.uni.lu'
    }
    expect(() => new ReqestHandler(params)).toThrowError()
  })
})