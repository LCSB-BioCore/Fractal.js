export default {
  data: state => state.data,
  tasks: state => state.tasks,
  subsets: state => state.subsets,
  requestManager: state => state.requestManager,
  chartManager: state => state.chartManager,
  stateManager: state => state.stateManager,
  controlPanel: state => state.controlPanel,
  filter: state => name => state.filters[name],
  options: state => state.options
}
