export default {
  data: state => state.data,
  loadedData: state => state.data.filter(d => d.loaded),
  subsets: state => state.subsets,
  requestManager: state => state.requestManager
}
