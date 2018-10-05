import Vue from 'vue'
import ChartManager from '../src/services/chart-manager'

describe('Chart manager', () => {
  const cm = new ChartManager()

  beforeEach(() => {
    const el = document.createElement('div')
    el.id = 'placeholder'
    document.body.appendChild(el)
  })

  afterEach(() => {
    const el = document.querySelector('#placeholder')
    el.parentNode.removeChild(el)
  })

  it('fails to set non existing charts', () => {
    const f = () => cm.setChart('foo', '#placeholder')
    expect(f).toThrowError(/.+not available.+/)
  })

  it('sets chart if it exists', () => {
    cm.setChart('scatterplot', '#placeholder')
    expect(document.querySelector('.fjs-chart')).toBeDefined()
  })

  afterAll(() => {
    document.body.innerHTML = ''
  })

  describe('parameter interface', () => {
    function testParameterInterface (chartName) {
      it(' is implemented correctly by ' + chartName, done => {
        const vm = cm.setChart('scatterplot', '#placeholder')
        const callback = {f: () => {}}
        spyOn(callback, 'f')
        cm.getChartParamDescr(vm, callback.f)
        expect(callback.f).toHaveBeenCalledTimes(1)
        let params = callback.f.calls.allArgs()[0][0]
        expect(Object.keys(params).length).toBeGreaterThan(0)
        Object.keys(params).forEach(key => {
          expect(Object.keys(params[key]).indexOf('label')).not.toBe(-1)
          expect(Object.keys(params[key]).indexOf('value')).not.toBe(-1)
        })
        const randomKey = Object.keys(params)[0]
        const randomValue = 'foo'
        vm._setParameters({[randomKey]: randomValue})
        Vue.nextTick(() => {
          expect(callback.f).toHaveBeenCalledTimes(2)
          params = callback.f.calls.allArgs()[1][0]
          expect(params[randomKey].value).toEqual(randomValue)
          done()
        })
      })
    }
    cm.getAvailableCharts().forEach(chartName => {
      testParameterInterface(chartName)
    })
  })
})
