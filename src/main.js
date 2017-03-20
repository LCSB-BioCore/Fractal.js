import 'babel-polyfill'
import { ChartManager } from './services/chartManager'

const chartManager = new ChartManager()

function setChart (name, elementId) {
  chartManager.setChart(name, elementId)
}

export { setChart }
