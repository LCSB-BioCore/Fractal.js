<template>
  <chart v-on:resize="resize">
    <control-panel class="fjs-control-panel">
      <data-box class="fjs-data-box"
                header="Numerical Variables"
                dataType="numerical_array"
                v-on:update="update_numericArrayData">
      </data-box>
      <hr class="fjs-seperator"/>

      <div class="fjs-ranking-params">
        <span class="fjs-param-header">Ranking Criteria</span>
        <fieldset>
          <legend>Expression Level</legend>
          <div>
            <label for="fjs-level-1">Mean</label>
            <input type="radio" id="fjs-level-1" value="mean" v-model="rankingMethod">
          </div>
          <div>
            <label for="fjs-level-2">Median</label>
            <input type="radio" id="fjs-level-2" value="median" v-model="rankingMethod">
          </div>
        </fieldset>
        <fieldset>
          <legend>Expression Variability</legend>
          <div>
            <label for="fjs-var-1">Variance</label>
            <input type="radio" id="fjs-var-1" value="variance" v-model="rankingMethod">
          </div>
        </fieldset>
        <fieldset>
          <legend>Differential Expression</legend>
          <div>
            <label for="fjs-dgea-1">logFC</label>
            <input type="radio" id="fjs-dgea-1" value="logFC" v-model="rankingMethod">
          </div>
          <div>
            <label for="fjs-dgea-2">t</label>
            <input type="radio" id="fjs-dgea-2" value="t" v-model="rankingMethod">
          </div>
          <div>
            <label for="fjs-dgea-3">F</label>
            <input type="radio" id="fjs-dgea-3" value="F" v-model="rankingMethod">
          </div>
          <div>
            <label for="fjs-dgea-4">B</label>
            <input type="radio" id="fjs-dgea-4" value="B" v-model="rankingMethod">
          </div>
          <div>
            <label for="fjs-dgea-5">P.Value</label>
            <input type="radio" id="fjs-dgea-5" value="P.Value" v-model="rankingMethod">
          </div>
          <div>
            <label for="fjs-dgea-6">adj.P.Value</label>
            <input type="radio" id="fjs-dgea-6" value="adj.P.Value" v-model="rankingMethod">
          </div>
        </fieldset>
      </div>

      <div class="fjs-clustering-params">
        <span class="fjs-param-header">Heatmap Clustering</span>
        <fieldset class="fjs-cluster-algo-fieldset">
          <legend>Algorithm</legend>
          <div>
            <label for="fjs-hclust-radio">Hierarch.</label>
            <input type="radio" id="fjs-hclust-radio" value="hclust" v-model="cluster.algorithm"/>
          </div>
          <div>
            <label for="fjs-kmeans-radio">KMeans</label>
            <input type="radio" id="fjs-kmeans-radio" value="kmeans" v-model="cluster.algorithm"/>
          </div>
        </fieldset>

        <fieldset class="fjs-cluster-option-fieldset" v-if="cluster.algorithm == 'hclust'">
          <legend>Options</legend>
          <div class="fjs-hclust-selects">
            <select v-model="cluster.options.method">
              <option value="" selected disabled>-- Method --</option>
              <option :value="value"
                      v-for="value in ['single', 'complete', 'average', 'weighted', 'centroid', 'median', 'ward']"
                      v-model="cluster.options.method">
                {{ value }}
              </option>
            </select>
            <select v-model="cluster.options.metric">
              <option value="" selected disabled>-- Metric --</option>
              <option :value="value"
                      v-for="value in ['euclidean', 'sqeuclidean', 'cityblock', 'correlation', 'cosine']"
                      v-model="cluster.options.metric">
                {{ value }}
              </option>
            </select>
          </div>
          <div class="fjs-cluster-ranges">
            <label for="fjs-n-row-clusters">{{ cluster.options.n_row_clusters }} Row Clusters</label>
            <input id="fjs-n-row-clusters"
                   type="range"
                   min="1" max="20"
                   v-model="cluster.options.n_row_clusters"/>
          </div>
          <div class="fjs-cluster-ranges">
            <label for="fjs-n-col-clusters">{{ cluster.options.n_col_clusters }} Col Clusters</label>
            <input id="fjs-n-col-clusters"
                   type="range"
                   min="1" max="20"
                   v-model="cluster.options.n_col_clusters"/>
          </div>
        </fieldset>

        <fieldset class="fjs-cluster-option-fieldset" v-if="cluster.algorithm == 'kmeans'">
          <legend>Options</legend>
          <div class="fjs-cluster-ranges">
            <label for="fjs-n-row-centroids">{{ cluster.options.n_row_centroids }} Row Centroids</label>
            <input id="fjs-n-row-centroids"
                   type="range"
                   min="1" max="20"
                   v-model="cluster.options.n_row_centroids"/>
          </div>
          <div class="fjs-cluster-ranges">
            <label for="fjs-n-col-centroids">{{ cluster.options.n_col_centroids }} Col Centroids</label>
            <input id="fjs-n-col-centroids"
                   type="range"
                   min="1" max="20"
                   v-model="cluster.options.n_col_centroids"/>
          </div>
        </fieldset>
      </div>
    </control-panel>


    <svg :height="height" :width="width">
      <g :transform="`translate(${margin.left}, ${margin.top})`">
        <rect class="fjs-sig-bar"
              :x="bar.x"
              :y="bar.y"
              :height="bar.height"
              :width="bar.width"
              :fill="bar.fill"
              :title="bar.tooltip"
              v-for="bar in tweened.sigBars"
              v-tooltip>
        </rect>
        <rect class="fjs-cell"
              :x="cell.x"
              :y="cell.y"
              :height="cell.height"
              :width="cell.width"
              :fill="cell.fill"
              :title="cell.tooltip"
              v-for="cell in tweened.cells"
              v-tooltip>
        </rect>
      </g>
    </svg>
  </chart>
</template>

<script>
  import DataBox from '../components/DataBox.vue'
  import ControlPanel from '../components/ControlPanel.vue'
  import Chart from '../components/Chart.vue'
  import store from '../../store/store'
  import runAnalysis from '../mixins/run-analysis'
  import * as d3 from 'd3'
  import tooltip from '../directives/tooltip.js'
  import deepFreeze from 'deep-freeze-strict'
  import { tweenGroup } from '../mixins/utils'
  export default {
    name: 'heatmap',
    data () {
      return {
        width: 0,
        height: 0,
        colorScale: d3.interpolateCool,
        numericArrayDataIds: [],
        rankingMethod: 'mean',
        cluster: {
          algorithm: 'hclust',
          options: {
            method: '',
            metric: '',
            n_row_clusters: 5,
            n_col_clusters: 5,
            n_row_centroids: 5,
            n_col_centroids: 5
          },
          colColors: d3.schemeCategory20,
          rowColors: d3.schemeCategory20.slice().reverse(),
          results: {
            rows: [],
            cols: []
          }
        },
        results: {
          data: [],
          stats: []
        },
        tweened: {
          cells: [],
          sigBars: []
        }
      }
    },
    computed: {
      mainArgs () {
        return {
          numerical_arrays: this.numericArrayDataIds,
          numericals: [],
          categoricals: [],
          ranking_method: this.rankingMethod,
          id_filter: this.idFilter,
          max_rows: 100,
          subsets: store.getters.subsets
        }
      },
      clusterArgs () {
        const df = {}
        this.results.data.forEach(d => {
          if (typeof df[d.id] === 'undefined') {
            df[d.id] = {}
          }
          df[d.id][d.feature] = d.zscore
        })
        return {
          df: df,
          cluster_algo: this.cluster.algorithm,
          options: {
            method: this.cluster.options.method,
            metric: this.cluster.options.metric,
            n_row_clusters: parseInt(this.cluster.options.n_row_clusters),
            n_col_clusters: parseInt(this.cluster.options.n_col_clusters),
            n_row_centroids: parseInt(this.cluster.options.n_row_centroids),
            n_col_centroids: parseInt(this.cluster.options.n_col_centroids)
          }
        }
      },
      idFilter () {
        return store.getters.filter('ids')
      },
      margin () {
        const left = this.width / 15
        const top = 10
        const right = 10
        const bottom = 10
        return { left, top, right, bottom }
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return { width, height }
      },
      cols () {
        let cols = []
        if (this.cluster.results.cols.length) {
          cols = this.cluster.results.cols.map(d => d[0])
        } else {
          cols = [...new Set(this.results.data.map(d => d.id))]
        }
        cols = cols.concat(['$padding_col$', '$cluster_col$'])
        return cols
      },
      rows () {
        let rows = ['$cluster_row$', '$padding_row$']
        if (this.cluster.results.rows.length) {
          rows = rows.concat(this.cluster.results.rows.map(d => d[0]))
        } else {
          rows = rows.concat([...new Set(this.results.data.map(d => d.feature))])
        }
        return rows
      },
      grid () {
        const mainWidth = this.padded.width / this.cols.length
        let mainHeight = this.padded.height / this.rows.length
        mainHeight = mainHeight < mainWidth / 4 ? mainHeight : mainWidth / 4
        // noinspection JSSuspiciousNameCombination
        return {
          main: { height: mainHeight, width: mainWidth },
          rowCluster: { height: mainHeight, width: mainWidth / 2 },
          colCluster: { height: mainHeight * 2, width: mainWidth },
          padding: { height: mainHeight, width: mainHeight }
        }
      },
      scales () {
        const x = d3.scaleOrdinal()
          .domain(this.cols)
          .range((() => {
            let range = []
            for (let i = 0; i < this.cols.length - 2; i++) {
              range.push(i * this.grid.main.width)
            }
            range = range.concat([
              (this.cols.length - 2) * this.grid.main.width,  // '$padding_col$'
              (this.cols.length - 2) * this.grid.main.width + this.grid.padding.width // '$cluster_col$'
            ])
            return range
          })())
        const y = d3.scaleOrdinal()
          .domain(this.rows)
          .range((() => {
            let range = [
              0,  // '$cluster_row$'
              this.grid.colCluster.height  // '$padding_row$'
            ]
            for (let i = 2; i < this.rows.length; i++) {
              range.push(this.grid.colCluster.height + this.grid.padding.height + (i - 2) * this.grid.main.height)
            }
            return range
          })())
        return { x, y }
      },
      currentStats () {
        return this.results.stats.map(d => d[this.rankingMethod])
      },
      sigScales () {
        const x = d3.scaleLinear()
          .domain(d3.extent(this.currentStats))
          .range([0, this.margin.left])
        const y = this.scales.y // has the same y scale than the heatmap grid
        return { x, y }
      },
      cells () {
        const cells = []
        this.results.data.forEach(d => {
          cells.push({
            x: this.scales.x(d.id),
            y: this.scales.y(d.feature),
            width: this.grid.main.width,
            height: this.grid.main.height,
            fill: this.colorScale(1 / (1 + Math.pow(Math.E, -d.zscore))),
            tooltip: `
<div>
  <p>Column: ${d.id}</p>
  <p>Row: ${d.feature}</p>
  <p>Value: ${d.value}</p>
  <p>z-Score ${d.zscore}</p>
</div>
`
          })
        })
        this.cluster.results.rows.forEach(d => {
          // noinspection JSSuspiciousNameCombination
          cells.push({
            x: this.scales.x('$cluster_col$'),
            y: this.scales.y(d[0]),
            width: this.grid.rowCluster.width,
            height: this.grid.rowCluster.height,
            fill: this.cluster.rowColors[d[1] % this.cluster.rowColors.length],
            tooltip: `
<div>
  <p>Row: ${d[0]}</p>
  <p>Cluster: ${d[1]}</p>
</div>
`
          })
        })
        this.cluster.results.cols.forEach(d => {
          // noinspection JSSuspiciousNameCombination
          cells.push({
            x: this.scales.x(d[0]),
            y: this.scales.y('$cluster_row$'),
            width: this.grid.colCluster.width,
            height: this.grid.colCluster.height,
            fill: this.cluster.colColors[d[1] % this.cluster.colColors.length],
            tooltip: `
<div>
  <p>Column: ${d[0]}</p>
  <p>Cluster: ${d[1]}</p>
</div>
`
          })
        })
        return cells
      },
      sigBars () {
        return this.results.stats.map(d => {
          return {
            x: -this.sigScales.x(d[this.rankingMethod]),
            y: this.sigScales.y(d.feature),
            width: this.sigScales.x(d[this.rankingMethod]),
            height: this.grid.main.height,
            fill: d[this.rankingMethod] < 0 ? '#0072ff' : '#ff006a',
            tooltip: '<div>' + Object.keys(d).map(key => {
              const selected = key === this.rankingMethod ? '<span style="font-weight: bold;">[selected]<span> ' : ''
              return `<p>${selected}${key}: ${d[key]}</p>`
            }).join('') + '</div>'
          }
        })
      }
    },
    methods: {
      computeHeatmap (args) {
        runAnalysis({task_name: 'compute-heatmap', args})
          .then(response => {
            const results = JSON.parse(response)
            results.data = JSON.parse(results.data)
            results.stats = JSON.parse(results.stats)
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            this.results = results
          })
      },
      computeCluster (args) {
        runAnalysis({task_name: 'compute-cluster', args})
          .then(response => {
            const results = JSON.parse(response)
            this.cluster.results.rows = results['row_clusters']
            this.cluster.results.cols = results['col_clusters']
          })
      },
      resize ({height, width}) {
        this.height = height
        this.width = width
      },
      update_numericArrayData (ids) {
        this.numericArrayDataIds = ids
      }
    },
    watch: {
      'mainArgs': {
        handler: function (args) {
          if (args.numerical_arrays.length > 0) {
            this.computeHeatmap(args)
          }
        }
      },
      'clusterArgs': {
        handler: function (args) {
          if ((args.cluster_algo === 'hclust' && args.options.method && args.options.metric) ||
            args.cluster_algo === 'kmeans') {
            this.computeCluster(args)
          }
        }
      },
      'cells': {
        handler: function (newCells) {
          tweenGroup({
            mutation: (v) => { this.tweened.cells = v },
            model: this.tweened.cells,
            target: newCells,
            animationTime: 1
          })
        }
      },
      'sigBars': {
        handler: function (newSigBars) {
          tweenGroup({
            mutation: (v) => { this.tweened.sigBars = v },
            model: this.tweened.sigBars,
            target: newSigBars,
            animationTime: 1
          })
        }
      }
    },
    components: {
      ControlPanel,
      DataBox,
      Chart
    },
    directives: {
      tooltip
    }
  }
</script>

<style lang="sass" scoped>
  @import './src/assets/base.sass'

  .fjs-control-panel
    .fjs-param-header
      text-align: center
      margin: 10px 0 5px 0
    .fjs-ranking-params
      display: flex
      flex-direction: column
      flex-shrink: 0
      fieldset
        display: flex
        flex-direction: row
        flex-wrap: nowrap
        justify-content: flex-start
        margin: 0.4vh 0 0.4vh 0
        border: solid 1px #fff
        border-radius: 3px
    .fjs-clustering-params
      display: flex
      flex-direction: column
      flex-shrink: 0
      .fjs-cluster-algo-fieldset
        border: solid 1px #fff
        border-radius: 3px
        margin: 0.4vh 0 0.4vh 0
        div
          float: left
      .fjs-cluster-option-fieldset
        display: flex
        flex-direction: column
        border: solid 1px #fff
        border-radius: 3px
        margin: 0.4vh 0 0.4vh 0
        div
          margin-top: 3px
        .fjs-hclust-selects
          display: flex
          flex-direction: row
          justify-content: space-between
          select
            width: 49%
        .fjs-cluster-ranges
          text-align: center
    svg
      .fjs-cell
        stroke: none
        shape-rendering: crispEdges
      .fjs-cell:hover
        opacity: 0.4
      .fjs-sig-bar
        stroke-width: none
        shape-rendering: crispEdges
</style>
