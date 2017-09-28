export default {
  data: state => state.data,
  tasks: state => state.tasks,
  subsets: state => state.subsets,
  requestManager: state => state.requestManager,
  controlPanels: state => state.controlPanels,
  filter: state => name => state.filters[name],
  animation: state => state.animation
}
