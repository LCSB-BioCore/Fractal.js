<template>
  <chart v-on:resize="resize">
    <control-panel name="Heatmap Panel">
      <data-box :header="params.numVars.label"
                :dataTypes="['numerical_array']"
                :validRange="[params.numVars.minLength, params.numVars.maxLength]"
                v-on:select="updateNumVarsSelection"
                v-on:update="updateNumVars">
      </data-box>
      <hr class="fjs-seperator"/>

      <div class="fjs-ranking-params">
        <span class="fjs-param-header">{{ params.rankingMethod.label }}</span>
        <fieldset class="fjs-expression-ranking fjs-fieldset">
          <div v-for="method in params.rankingMethod.validValues">
            <label>
              <input type="radio" :value="method" v-model="params.rankingMethod.value">
              Mean
            </label>
          </div>
        </fieldset>
      </div>

      <div class="fjs-clustering-params">
        <span class="fjs-param-header">{{ params.clusterAlgorithm.label }}</span>
        <fieldset class="fjs-fieldset">
          <legend>Algorithm</legend>
          <div v-for="algorithm in params.clusterAlgorithm.validValues">
            <label>
              <input type="radio" :value="algorithm" v-model="params.clusterAlgorithm.value"/>
              {{ algorithm }}
            </label>
          </div>
        </fieldset>

        <fieldset class="fjs-cluster-option-fieldset fjs-fieldset" v-if="params.clusterAlgorithm.value === 'hclust'">
          <legend>Options</legend>
          <div class="fjs-hclust-selects">
            <select v-model="params.clusterMethod.value">
              <option value="" selected disabled>--{{ params.clusterMethod.label }}--</option>
              <option :value="value"
                      v-for="value in params.clusterMethod.validValues"
                      v-model="params.clusterMethod.value">
                {{ value }}
              </option>
            </select>
            <select v-model="params.clusterMetric.value">
              <option value="" selected disabled>--{{ params.clusterMetric.label }}--</option>
              <option :value="value"
                      v-for="value in params.clusterMetric.validValues"
                      v-model="params.clusterMetric.value">
                {{ value }}
              </option>
            </select>
          </div>
          <div class="fjs-cluster-ranges">
            <label>
              <input type="range"
                     :min="params.nRowClusters.min" :max="params.nRowClusters.max"
                     v-model="params.nRowClusters.value"/>
              {{ params.nRowClusters.value }} {{ params.nRowClusters.label }}
            </label>
          </div>
          <div class="fjs-cluster-ranges">
            <label>
              <input type="range"
                     :min="params.nColClusters.min" :max="params.nColClusters.max"
                     v-model="params.nColClusters.value"/>
              {{ params.nColClusters.value }} {{ params.nColClusters.label }}
            </label>
          </div>
        </fieldset>

        <fieldset class="fjs-cluster-option-fieldset fjs-fieldset" v-if="cluster.algorithm === 'kmeans'">
          <legend>Options</legend>
          <div class="fjs-cluster-ranges">
            <label>
            <input type="range"
                   :min="params.nRowCentroids.min" :max="params.nRowCentroids.max"
                   v-model="params.nRowCentroids.value"/>
              {{ params.nRowCentroids.value }} {{ params.nRowCentroids.label }}
            </label>
          </div>
          <div class="fjs-cluster-ranges">
            <label>
            <input type="range"
                   :min="params.nColCentroids.min" :max="params.nColCentroids.max"
                   v-model="params.nColCentroids.value"/>
              {{ params.nColCentroids.value }} {{ params.nColCentroids.label }}
            </label>
          </div>
        </fieldset>
      </div>
    </control-panel>

    <svg :height="height" :width="width">
      <g :transform="`translate(${margin.left}, ${margin.top})`">
        <image :xlink:href="dataUrl" :width="padded.width" :height="padded.height"></image>
        <rect class="fjs-sig-bar"
              :x="bar.x"
              :y="bar.y"
              :height="bar.height"
              :width="bar.width"
              :fill="bar.fill"
              :title="bar.tooltip"
              v-for="bar in sigBars"
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
  import RunAnalysis from '../mixins/run-analysis'
  import * as d3 from 'd3'
  import tooltip from '../directives/tooltip.js'
  import deepFreeze from 'deep-freeze-strict'
  import getHDPICanvas from '../../utils/high-dpi-canvas'
  import ParameterInterface from '../mixins/parameter-interface'
  import _ from 'lodash'
  export default {
    name: 'heatmap',
    data () {
      return {
        width: 0,
        height: 0,
        colorScale: d3.interpolateCool,
        subsetColors: d3.schemeCategory10,
        params: {
          numVars: {
            label: 'Numerical Variables',
            type: Array,
            elementType: String,
            validValues: [],
            minLength: 1,
            maxLength: Infinity,
            value: []
          },
          rankingMethod: {
            label: 'Ranking Criteria',
            type: String,
            validValues: [],
            value: 'mean'
          },
          clusterAlgorithm: {
            label: 'Heatmap Clustering',
            type: String,
            validValues: ['hclust', 'kmeans'],
            value: 'hclust'
          },
          clusterMethod: {
            label: 'Cluster Method',
            type: String,
            validValues: ['single', 'complete', 'average', 'weighted', 'centroid', 'median', 'ward'],
            value: ''
          },
          clusterMetric: {
            label: 'Cluster Metric',
            type: String,
            validValues: ['euclidean', 'sqeuclidean', 'cityblock', 'correlation', 'cosine'],
            value: ''
          },
          nRowClusters: {
            label: 'Row Clusters',
            type: Number,
            min: 1,
            max: 20,
            value: 5
          },
          nColClusters: {
            label: 'Col Clusters',
            type: Number,
            min: 1,
            max: 20,
            value: 5
          },
          nRowCentroids: {
            label: 'Row Centroids',
            type: Number,
            min: 1,
            max: 20,
            value: 5
          },
          nColCentroids: {
            label: 'Col Centroids',
            type: Number,
            min: 1,
            max: 20,
            value: 5
          }
        },
        cluster: {
          colColors: d3.schemeCategory10,
          rowColors: d3.schemeCategory10.slice().reverse(),
          results: {
            rows: [],
            cols: []
          }
        },
        results: {
          data: {id: [], feature: [], value: [], zscore: []},
          stats: {feature: []}
        },
        dataUrl: ''
      }
    },
    mounted () {
      this.registerParameterObjectInterface('params')
    },
    computed: {
      mainArgs () {
        return {
          numerical_arrays: this.params.numVars.value,
          numericals: [],
          categoricals: [],
          ranking_method: this.params.rankingMethod.value,
          params: {},
          id_filter: this.idFilter.value,
          max_rows: 100, // FIXME: make this configurable
          subsets: store.getters.subsets
        }
      },
      clusterArgs () {
        const df = {}
        this.results.data.id.forEach((d, i) => {
          if (typeof df[d] === 'undefined') {
            df[d] = {}
          }
          df[d][this.results.data.feature[i]] = this.results.data.zscore[i]
        })
        return {
          df: df,
          cluster_algo: this.params.clusterAlgorithm.value,
          options: {
            method: this.params.clusterMethod.value,
            metric: this.params.clusterMetric.value,
            n_row_clusters: parseInt(this.params.nRowClusters.value),
            n_col_clusters: parseInt(this.params.nColClusters.value),
            n_row_centroids: parseInt(this.params.nRowCentroids.value),
            n_col_centroids: parseInt(this.params.nColCentroids.value)
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
        let width = this.width - this.margin.left - this.margin.right
        let height = this.height - this.margin.top - this.margin.bottom
        width = width < 0 ? 0 : width
        height = height < 0 ? 0 : height
        return { width, height }
      },
      canvas () {
        return getHDPICanvas(this.padded.width, this.padded.height)
      },
      statistics () {
        if ((this.params.rankingMethod.value === 'limma') && (store.getters.subsets.length === 2)) {
          return ['logFC', 'P.Value', 'feature', 'AveExpr', 't', 'adj.P.Val', 'B']
        } else if ((this.params.rankingMethod.value === 'limma') && (store.getters.subsets.length > 2)) {
          return ['F', 'P.Value', 'feature', 'AveExpr', 'adj.P.Val']
        } else {
          throw new Error(`Unknown ranking method: ${this.params.rankingMethod.value}`)
        }
      },
      cols () {
        let cols = []
        if (this.cluster.results.cols.length) {
          cols = this.cluster.results.cols.map(d => d[0])
        } else {
          cols = [...new Set(this.results.data.id)]
        }
        cols = cols.concat(['$padding_col$', '$cluster_col$'])
        return cols
      },
      rows () {
        let rows = ['$subset_row$', '$cluster_row$', '$padding_row$']
        if (this.cluster.results.rows.length) {
          rows = rows.concat(this.cluster.results.rows.map(d => d[0]))
        } else {
          rows = rows.concat([...new Set(this.results.data.feature)])
        }
        return rows
      },
      grid () {
        const maxWidth = this.padded.width / this.cols.length
        let maxHeight = this.padded.height / this.rows.length
        const gridSize = maxWidth < maxHeight ? maxWidth : maxHeight
        return {
          main: { height: gridSize, width: gridSize },
          rowCluster: { height: gridSize, width: gridSize },
          colCluster: { height: gridSize, width: gridSize },
          padding: { height: gridSize, width: gridSize }
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
              (this.cols.length - 2) * this.grid.main.width, // '$padding_col$'
              (this.cols.length - 2) * this.grid.main.width + this.grid.padding.width // '$cluster_col$'
            ])
            return range
          })())
        const y = d3.scaleOrdinal()
          .domain(this.rows)
          .range((() => {
            let range = [
              0, // '$cluster_row$'
              this.grid.colCluster.height // '$padding_row$'
            ]
            for (let i = 2; i < this.rows.length; i++) {
              range.push(this.grid.colCluster.height + this.grid.padding.height + (i - 2) * this.grid.main.height)
            }
            return range
          })())
        return { x, y }
      },
      currentStats () {
        return this.results.stats[this.rankingMethod]
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
        this.results.data.id.forEach((d, i) => {
          cells.push({
            x: this.scales.x(d),
            y: this.scales.y(this.results.data.feature[i]),
            width: this.grid.main.width,
            height: this.grid.main.height,
            fill: this.colorScale(1 / (1 + Math.pow(Math.E, -this.results.data.zscore[i]))),
            tooltip: `
<div>
  <p>Column: ${d}</p>
  <p>Row: ${this.results.data.feature[i]}</p>
  <p>Value: ${this.results.data.value[i]}</p>
  <p>z-Score ${this.results.data.zscore[i]}</p>
</div>
`
          })
        })
        const idSubsetMap = this.results.data.id.map((d, i) => { return {id: d, subset: this.results.data.subset[i]} })
          .reduce((acc, curr) => {
            if (typeof acc[curr.id] === 'undefined') {
              acc[curr.id] = curr.subset
            }
            return acc
          }, {})
        Object.keys(idSubsetMap).forEach(d => {
          cells.push({
            x: this.scales.x(d),
            y: this.scales.y('$subset_row$'),
            width: this.grid.main.width,
            height: this.grid.main.height,
            fill: this.subsetColors[idSubsetMap[d] % this.subsetColors.length],
            tooltip: `
<div>
  <p>Col: ${d}</p>
  <p>Subset: ${idSubsetMap[d]}</p>
</div>
`
          })
        })
        this.cluster.results.rows.forEach(d => {
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
        return this.results.stats.feature.map((d, i) => {
          return {
            x: -this.sigScales.x(this.results.stats[this.params.rankingMethod.value][i]),
            y: this.sigScales.y(d),
            width: this.sigScales.x(this.results.stats[this.params.rankingMethod.value][i]),
            height: this.grid.main.height,
            fill: this.results.stats[this.params.rankingMethod.value][i] < 0 ? '#0072ff' : '#ff006a',
            tooltip: '<div>' + Object.keys(this.results.stats).map(key => {
              const selected = key === this.params.rankingMethod.value ? '<span style="font-weight: bold;">[selected]<span> ' : ''
              return `<p>${selected}${key}: ${this.results.stats[key][i]}</p>`
            }).join('') + '</div>'
          }
        })
      }
    },
    methods: {
      computeHeatmap (args) {
        this.runAnalysis('compute-heatmap', args)
          .then(response => {
            const results = JSON.parse(response)
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            this.results = results
          })
      },
      computeCluster (args) {
        this.runAnalysis('compute-cluster', args)
          .then(response => {
            const results = JSON.parse(response)
            deepFreeze(results)
            this.cluster.results.rows = results['row_clusters']
            this.cluster.results.cols = results['col_clusters']
          })
      },
      resize (width, height) {
        this.width = width
        this.height = height
      },
      drawCells (cells) {
        const ctx = this.canvas.getContext('2d')
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        cells.forEach(d => {
          ctx.beginPath()
          ctx.fillStyle = d.fill
          ctx.fillRect(d.x, d.y, d.width, d.height)
        })
        this.dataUrl = this.canvas.toDataURL()
      },
      updateNumVars (ids) {
        this.params.numVars.validValues = ids
      },
      updateNumVarsSelection (ids) {
        this.params.numVars.value = ids
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
          this.$nextTick(() => this.drawCells(newCells))
        }
      },
      'statistics': {
        handler: function (newStats, oldStats) {
          if (!_.isEqual(newStats, oldStats)) {
            this.params.rankingMethod.validValues = newStats
          }
        },
        immediate: true
      }
    },
    components: {
      ControlPanel,
      DataBox,
      Chart
    },
    directives: {
      tooltip
    },
    mixins: [
      ParameterInterface,
      RunAnalysis
    ]
  }
</script>

<style lang="sass" scoped>
  @import '~assets/base.sass'

  .fjs-control-panel
    .fjs-param-header
      text-align: center
      margin: 10px 0 5px 0
    .fjs-ranking-params
      display: flex
      flex-direction: column
      flex-shrink: 0
    .fjs-clustering-params
      display: flex
      flex-direction: column
      flex-shrink: 0
      .fjs-cluster-option-fieldset
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
        stroke-width: 1px
        shape-rendering: crispEdges
</style>
