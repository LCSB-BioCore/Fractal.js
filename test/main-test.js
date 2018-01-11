import { init } from '../src/main'

describe('initializer', () => {
  it('throws if given invalid parameters', () => {
    let f = () => init({handler: '', dataSource: 'foo', fractalisNode: 'foo', getAuth: () => {}})
    expect(f).toThrow()
    f = () => init({handler: 'foo', dataSource: '', fractalisNode: 'foo', getAuth: () => {}})
    expect(f).toThrow()
    f = () => init({handler: 'foo', dataSource: 'foo', fractalisNode: '', getAuth: () => {}})
    expect(f).toThrow()
    f = () => init({dataSource: 'foo', fractalisNode: 'foo', getAuth: () => {}})
    expect(f).toThrow()
    f = () => init({handler: 'foo', fractalisNode: 'foo', getAuth: () => {}})
    expect(f).toThrow()
    f = () => init({handler: 'foo', dataSource: 'foo', getAuth: () => {}})
    expect(f).toThrow()
    f = () => init({handler: 'foo', dataSource: 'foo', fractalisNode: 'foo'})
    expect(f).toThrow()
  })

  it('returns FractalJS instance if given valid parameters', () => {
    const fjs = init({handler: 'ada', dataSource: 'foo', fractalisNode: 'foo', getAuth: () => {}})
    expect(fjs.constructor.name).toBe('FractalJS')
  })
})
