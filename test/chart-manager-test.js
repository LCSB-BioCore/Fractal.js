import ChartManager from '../src/services/chart-manager'

describe('Chart manager', () => {
  const cm = new ChartManager()

  beforeEach(() => {
    const el = document.createElement('div')
    el.className = 'placeholder'
    document.body.appendChild(el)
  })

  afterEach(() => {
    const el = document.querySelector('.placeholder')
    el.parentNode.removeChild(el)
  })

  it('fails to set non existing charts', () => {
    const f = () => cm.setChart({chart: 'foo', selector: 'placeholder'})
    expect(f).toThrow()
  })

  it('sets chart if it exists', () => {
    cm.setChart({chart: 'correlation-analysis', selector: 'placeholder'})
    expect(document.querySelector('.fjs-correlation-analysis')).toBeDefined()
  })
})
