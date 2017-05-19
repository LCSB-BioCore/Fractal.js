export default {
  data: state => state.data,
  subsets: state => state.subsets,
  requestManager: state => state.requestManager,
  filter: state => name => state.filters[name]
}
