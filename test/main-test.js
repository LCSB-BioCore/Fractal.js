import { init } from '../src/main'

describe('initializer', () => {
  it('throws if given invalid parameters', () => {
    let f = () => init({handler: '', thisBaseURL: 'foo', fractalisBaseURL: 'foo', getAuth: () => {}})
    expect(f).toThrow()
    f = () => init({handler: 'foo', thisBaseURL: '', fractalisBaseURL: 'foo', getAuth: () => {}})
    expect(f).toThrow()
    f = () => init({handler: 'foo', thisBaseURL: 'foo', fractalisBaseURL: '', getAuth: () => {}})
    expect(f).toThrow()
    f = () => init({thisBaseURL: 'foo', fractalisBaseURL: 'foo', getAuth: () => {}})
    expect(f).toThrow()
    f = () => init({handler: 'foo', fractalisBaseURL: 'foo', getAuth: () => {}})
    expect(f).toThrow()
    f = () => init({handler: 'foo', thisBaseURL: 'foo', getAuth: () => {}})
    expect(f).toThrow()
    f = () => init({handler: 'foo', thisBaseURL: 'foo', fractalisBaseURL: 'foo'})
    expect(f).toThrow()
  })

  it('returns FractalJS instance if given valid parameters', () => {
    const fjs = init({handler: 'ada', thisBaseURL: 'foo', fractalisBaseURL: 'foo', getAuth: () => {}})
    expect(fjs.constructor.name).toBe('FractalJS')
  })
})
