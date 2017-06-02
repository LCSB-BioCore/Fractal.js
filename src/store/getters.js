export default {
  data: state => state.data,
  tasks: state => state.tasks,
  subsets: state => state.subsets,
  requestManager: state => state.requestManager,
  filter: state => name => state.filters[name]
}
