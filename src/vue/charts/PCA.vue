<template>
  <chart v-on:resize="resize">

    <control-panel class="fjs-control-panel">
      <data-box class="fjs-data-box"
                header="Features"
                dataType="numerical,numerical_array"
                v-on:update="update_featureData">
      </data-box>
      <data-box class="fjs-data-box"
                header="Categories"
                dataType="categorical"
                v-on:update="update_categoryData">
      </data-box>
      <hr class="fjs-seperator"/>
      <div>
        <input id="fjs-whiten-check" type="checkbox" v-model="params.whiten"/>
        <label for="fjs-whiten-check">Whiten Output</label>
      </div>
    </control-panel>

    <svg :width="width"
         :height="height">
      <g :transform="`translate(${margin.left}, ${margin.top})`">
        <g class="fjs-brush"></g>
        <g class="fjs-axis fjs-y-axis-2" :transform="`translate(${padded.width}, 0)`"></g>
        <g class="fjs-axis fjs-x-axis-2"></g>
        <g class="fjs-axis fjs-x-axis-1" :transform="`translate(0, ${padded.height})`"></g>
        <g class="fjs-axis fjs-y-axis-1"></g>
        <text :x="padded.width / 2"
              :y="- margin.top / 2"
              text-anchor="middle">
          Principal Component 1 (Variance Ratio: {{ results.variance_ratios[0].toFixed(2) }})
        </text>
        <text text-anchor="middle"
              :transform="`translate(${this.padded.width + this.margin.right / 2}, ${this.padded.height / 2})rotate(90)`">
          Principal Component 2 (Variance Ratio: {{ results.variance_ratios[1].toFixed(2) }})
        </text>
        <polygon class="fjs-scatterplot-point"
                 :points="point.shape"
                 :fill="categoryColors[categories.indexOf(point.category) % categoryColors.length]"
                 :title="point.tooltip"
                 v-tooltip
                 v-for="point in tweened.points">
        </polygon>
        <g v-for="loading in tweened.loadings">
          <line class="fjs-loadings"
                :x1="loading.x1"
                :x2="loading.x2"
                :y1="loading.y1"
                :y2="loading.y2">
          </line>
          <text class="fjs-loading-label"
                :x="loading.x2"
                :y="loading.y2"
                text-anchor="middle">
            {{ loading.feature }}
          </text>
          <g class="fjs-pc-distribution" :transform="`translate(0, ${padded.height + margin.bottom / 2})`">
            <line x1="0" y1="0" :x2="padded.width" y2="0"></line>
            <circle :cx="point.x"
                    cy="0"
                    :r="width / 150"
                    v-for="point in tweened.points">
            </circle>
          </g>
          <g class="fjs-pc-distribution" :transform="`translate(${- margin.left / 2}, 0)`">
            <line x1="0" y1="0" x2="0" :y2="padded.height"></line>
            <circle cx="0"
                    :cy="point.y"
                    :r="width / 150"
                    v-for="point in tweened.points">
            </circle>
          </g>
        </g>

      </g>
    </svg>
  </chart>
</template>

<script>
  import DataBox from '../components/DataBox.vue'
  import ControlPanel from '../components/ControlPanel.vue'
  import Chart from '../components/Chart.vue'
  import { getPolygonPointsForSubset, tweenGroup } from '../mixins/utils'
  import store from '../../store/store'
  import runAnalysis from '../mixins/run-analysis'
  import * as d3 from 'd3'
  import tooltip from '../directives/tooltip.js'
  import deepFreeze from 'deep-freeze-strict'
  export default {
    name: 'pca-analysis',
    data () {
      return {
        height: 0,
        width: 0,
        featureData: [],
        categoryData: [],
        results: {
          data: [],
          loadings: [],
          variance_ratios: [0, 0]
        },
        categoryColors: d3.schemeCategory10,
        subsetColors: d3.schemeCategory10.slice().reverse(),
        selectedPoints: [],
        tweened: {
          points: [],
          loadings: []
        },
        hasSetFilter: false,
        params: {
          whiten: false
        }
      }
    },
    computed: {
      idFilter () {
        return store.getters.filter('ids')
      },
      args () {
        return {
          features: this.featureData,
          categories: this.categoryData,
          n_components: 2,
          whiten: this.params.whiten,
          id_filter: this.idFilter,
          subsets: store.getters.subsets
        }
      },
      validArgs () {
        return this.featureData.length > 1
      },
      margin () {
        const left = this.width / 20
        const top = this.height / 20
        const right = this.width / 20
        const bottom = this.height / 20
        return { left, top, right, bottom }
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return { width, height }
      },
      scales () {
        const x = d3.scaleLinear()
          .domain((() => {
            const xExtent = d3.extent(this.results.data.map(d => d['0']))
            const xPadding = (xExtent[1] - xExtent[0]) / 10
            return [xExtent[0] - xPadding, xExtent[1] + xPadding]
          })())
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain((() => {
            const yExtent = d3.extent(this.results.data.map(d => d['1']))
            const yPadding = (yExtent[1] - yExtent[0]) / 10
            return [yExtent[0] - yPadding, yExtent[1] + yPadding]
          })())
          .range([this.padded.height, 0])
        return { x, y }
      },
      loadingScales () {
        const x = d3.scaleLinear()
          .domain(d3.extent(this.scales.x.domain().concat(this.results.loadings.map(d => d[0]))))
          .range(this.scales.x.range())
        const y = d3.scaleLinear()
          .domain(d3.extent(this.scales.y.domain().concat(this.results.loadings.map(d => d[1]))))
          .range(this.scales.y.range())
        return { x, y }
      },
      points () {
        return this.results.data.map(d => {
          return {
            x: this.scales.x(d['0']),
            y: this.scales.y(d['1']),
            id: d.id,
            category: d.category,
            subset: d.subset,
            shape: getPolygonPointsForSubset(
              {cx: this.scales.x(d['0']), cy: this.scales.y(d['1']), size: this.width / 150, subset: d.subset}),
            tooltip: `
<div>
  <p>ID: ${d.id}</p>
  <p>Subset: ${d.subset}</p>
  ${d.category !== '' ? '<p>Category: ' + d.category + '</p>' : ''}
</div>
`
          }
        })
      },
      loadings () {
        return this.results.loadings.map(d => {
          return {
            x1: this.loadingScales.x(0),
            y1: this.loadingScales.y(0),
            x2: this.loadingScales.x(d[0]),
            y2: this.loadingScales.y(d[1]),
            feature: d.feature
          }
        })
      },
      categories () {
        return [...new Set(this.results.data.map(d => d.category))]
      },
      axis () {
        const x1 = d3.axisTop(this.scales.x)
        const y1 = d3.axisRight(this.scales.y)
        const x2 = d3.axisBottom(this.scales.x)
          .tickSizeInner(this.padded.height)
          .tickFormat('')
        const y2 = d3.axisLeft(this.scales.y)
          .tickSizeInner(this.padded.width)
          .tickFormat('')
        return { x1, x2, y1, y2 }
      },
      brush () {
        return d3.brush()
          .extent([[0, 0], [this.padded.width, this.padded.height]])
          .on('end', () => {
            if (!d3.event.selection) {
              this.selectedPoints = []
            } else {
              const [[x0, y0], [x1, y1]] = d3.event.selection
              this.selectedPoints = this.points.filter(d => {
                return x0 <= d.x && d.x <= x1 && y0 <= d.y && d.y <= y1
              })
            }
            store.dispatch('setFilter', {filter: 'ids', value: this.selectedPoints.map(d => d.id)})
            this.hasSetFilter = true
          })
      }
    },
    watch: {
      'args': {
        handler: function (newArgs) {
          if (this.validArgs && !this.hasSetFilter) {
            this.runAnalysisWrapper(newArgs)
          }
          this.hasSetFilter = false
        }
      },
      'axis': {
        handler: function (newAxis) {
          this.$nextTick(() => {
            d3.select(this.$el.querySelector('.fjs-y-axis-2')).call(newAxis.y2)
            d3.select(this.$el.querySelector('.fjs-x-axis-2')).call(newAxis.x2)
            d3.select(this.$el.querySelector('.fjs-x-axis-1')).call(newAxis.x1)
            d3.select(this.$el.querySelector('.fjs-y-axis-1')).call(newAxis.y1)
          })
        }
      },
      'points': {
        handler: function (newPoints) {
          tweenGroup({
            mutation: (v) => { this.tweened.points = v },
            model: this.tweened.points,
            target: newPoints,
            animationTime: 0.5
          })
        }
      },
      'loadings': {
        handler: function (newLoadings) {
          tweenGroup({
            mutation: (v) => { this.tweened.loadings = v },
            model: this.tweened.loadings,
            target: newLoadings,
            animationTime: 0.5
          })
        }
      },
      'brush': {
        handler: function (newBrush) {
          this.$nextTick(() => {
            d3.select(this.$el.querySelector('.fjs-brush')).call(newBrush)
          })
        }
      }
    },
    methods: {
      runAnalysisWrapper (args) {
        runAnalysis({task_name: 'compute-pca', args})
          .then(response => {
            const results = JSON.parse(response)
            results.data = JSON.parse(results.data)
            results.loadings = JSON.parse(results.loadings)
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            this.results = results
          })
          .catch(error => console.error(error))
      },
      resize ({height, width}) {
        this.height = height
        this.width = width
      },
      update_featureData (ids) {
        this.featureData = ids
      },
      update_categoryData (ids) {
        this.categoryData = ids
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
  svg
    .fjs-loadings
      stroke: #f00
      stroke-width: 1px
    .fjs-pc-distribution
      line
        stroke: #000
        stroke-width: 1px
        shape-rendering: crispEdges
      circle
        opacity: 0.05
</style>

<!--CSS for dynamically created components-->
<style lang="sass">
  .fjs-axis
    shape-rendering: crispEdges
    .tick
      shape-rendering: crispEdges
      line
        stroke: #E2E2E2
      text
        font-size: 0.75em
    path
      stroke: none
</style>
