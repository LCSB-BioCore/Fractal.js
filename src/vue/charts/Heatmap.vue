<template>
  <div class="fjs-heatmap" @click="$emit('focus')">
    <control-panel class="fjs-control-panel" focus="focus">
      <data-box class="fjs-data-box"
                header="Numerical Array Data"
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
            <label for="fjs-dgea-1">Something</label>
            <input type="radio" id="fjs-dgea-1" value="" v-model="rankingMethod">
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

    <chart class="fjs-chart">
      <svg height="100%" width="100%">
        <g :transform="`translate(${margin.left}, ${margin.top})`">
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
          <rect class="fjs-cluster-cell"
                :x="cell.x"
                :y="cell.y"
                :height="cell.height"
                :width="cell.width"
                :fill="cell.fill"
                :title="cell.tooltip"
                v-for="cell in idClusterCells"
                v-tooltip>
          </rect>
          <rect class="fjs-cluster-cell"
                :x="cell.x"
                :y="cell.y"
                :height="cell.height"
                :width="cell.width"
                :fill="cell.fill"
                :title="cell.tooltip"
                v-for="cell in variableClusterCells"
                v-tooltip>
          </rect>
          <rect class="fjs-cell"
                :x="tweened.cells[i].x"
                :y="tweened.cells[i].y"
                :height="cell.height"
                :width="cell.width"
                :fill="cell.fill"
                :title="cell.tooltip"
                v-for="cell, i in cells"
                v-tooltip>
          </rect>
        </g>
      </svg>
    </chart>
  </div>
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
  import { TimelineLite, TweenLite } from 'gsap'
  export default {
    name: 'heatmap',
    data () {
      return {
        width: 500,
        height: 500,
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
        ids: [],
        variables: [],
        results: {
          data: [],
          stats: []
        },
        tweened: {
          cells: []
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
          subsets: store.getters.subsets
        }
      },
      clusterArgs () {
        const df = {}
        this.results.data.forEach(d => {
          if (typeof df[d.id] === 'undefined') {
            df[d.id] = {}
          }
          df[d.id][d.variable] = d.zscore
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
        const left = this.width / 10
        const top = this.height / 10
        const right = this.width / 10
        const bottom = 20
        return { left, top, right, bottom }
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return { width, height }
      },
      gridBox () {
        const width = this.padded.width / this.ids.length
        let height = this.padded.height / this.variables.length
        height = height < width / 4 ? height : width / 4
        return { height, width }
      },
      scales () {
        const x = d3.scaleOrdinal()
          .domain(this.ids)
          .range(this.ids.map((d, i) => i * this.gridBox.width))
        const y = d3.scaleOrdinal()
          .domain(this.variables)
          .range(this.variables.map((d, i) => i * this.gridBox.height))
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
        return this.results.data.map(d => {
          return {
            x: this.scales.x(d.id),
            y: this.scales.y(d.variable),
            width: this.gridBox.width,
            height: this.gridBox.height,
            fill: this.colorScale(1 / (1 + Math.pow(Math.E, -d.zscore))),
            tooltip: `
<div>
  <p>Identifier: ${d.id}</p>
  <p>Variable: ${d.variable}</p>
  <p>Value: ${d.value}</p>
  <p>z-Score ${d.zscore}</p>
</div>
`
          }
        })
      },
      idClusterCells () {
        return this.cluster.results.cols.map(d => {
          return {
            x: this.scales.x(d[0]),
            y: -2 * this.gridBox.height,
            width: this.gridBox.width,
            height: this.gridBox.height,
            fill: this.cluster.colColors[d[1] % this.cluster.colColors.length],
            tooltip: `
<div>
  <p>Cluster: ${d[1]}</p>
  <p>Identifier: ${d[0]}</p>
</div>
`
          }
        })
      },
      variableClusterCells () {
        return this.cluster.results.rows.map(d => {
          // noinspection JSSuspiciousNameCombination
          return {
            x: this.padded.width + this.gridBox.height,
            y: this.scales.y(d[0]),
            width: this.gridBox.height,
            height: this.gridBox.height,
            fill: this.cluster.rowColors[d[1] % this.cluster.rowColors.length],
            tooltip: `
<div>
  <p>Cluster: ${d[1]}</p>
  <p>Variable: ${d[0]}</p>
</div>
`
          }
        })
      },
      sigBars () {
        return this.results.stats.map(d => {
          return {
            x: -this.sigScales.x(d[this.rankingMethod]),
            y: this.sigScales.y(d.variable),
            width: this.sigScales.x(d[this.rankingMethod]),
            height: this.gridBox.height,
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
            const data = JSON.parse(results.data)
            const stats = JSON.parse(results.stats)
            results.data = Object.keys(data).map(key => data[key])
            results.stats = Object.keys(stats).map(key => stats[key])
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            deepFreeze(stats) // massively improve performance by telling Vue that the objects properties won't change
            this.results = results
            this.ids = [...new Set(results.data.map(d => d.id))]
            this.variables = [...new Set(results.data.map(d => d.variable))]
          })
      },
      computeCluster (args) {
        runAnalysis({task_name: 'compute-cluster', args})
          .then(response => {
            const results = JSON.parse(response)
            this.ids = results['col_clusters'].map(d => d[0])
            this.variables = results['row_clusters'].map(d => d[0])
            this.cluster.results.rows = results['row_clusters']
            this.cluster.results.cols = results['col_clusters']
          })
      },
      handleResize () {
        const container = this.$el.querySelector('.fjs-chart svg')
        this.height = container.getBoundingClientRect().height
        this.width = container.getBoundingClientRect().width
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
        handler: function (newCells, oldCells) {
          if (!oldCells.length) {
            this.tweened.cells = newCells
            return
          }
          const timeline = new TimelineLite()
          if (this.tweened.cells.length >= newCells.length) {
            this.tweened.cells = this.tweened.cells.slice(0, newCells.length)
          } else {
            this.tweened.cells = this.tweened.cells.concat(newCells.slice(this.tweened.cells.length))
          }
          this.tweened.cells.forEach((tweenedCell, i) => {
            const tween = new TweenLite(tweenedCell, 1, newCells[i])
            timeline.add(tween, 0)
          })
          timeline.play()
        }
      }
    },
    mounted () {
      window.addEventListener('resize', this.handleResize)
      this.handleResize()
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.handleResize)
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

  .fjs-heatmap
    height: 100%
    width: 100%
    display: flex
    flex-direction: column

    .fjs-control-panel
      .fjs-param-header
        text-align: center
        margin: 10px 0 5px 0
      .fjs-ranking-params
        display: flex
        flex-direction: column
        fieldset
          display: flex
          flex-direction: column
          margin: 5px 0 5px 0
          text-align: end
      .fjs-clustering-params
        display: flex
        flex-direction: column
        .fjs-cluster-algo-fieldset
          div
            float: left
        .fjs-cluster-option-fieldset
          display: flex
          flex-direction: column
          div
            margin-top: 8px
          .fjs-hclust-selects
            display: flex
            flex-direction: row
            justify-content: space-between
            select
              width: 49%
          .fjs-cluster-ranges
            text-align: center


    .fjs-chart
      flex: 1
      display: flex
      svg
        flex: 1
        .fjs-cell
          stroke: none
          shape-rendering: crispEdges
        .fjs-cell:hover
          opacity: 0.4
        .fjs-sig-bar
          stroke-width: none
          shape-rendering: crispEdges
</style>
