<template>
  <chart v-on:resize="resize">

    <control-panel class="fjs-control-panel">
      <data-box class="fjs-data-box"
                header="Features"
                dataType="numerical"
                v-on:update="update_featureData">
      </data-box>
      <data-box class="fjs-data-box"
                header="Categories"
                dataType="categorical"
                v-on:update="update_categoryData">
      </data-box>

    </control-panel>

    <svg :width="width"
         :height="height">
      <g :transform="`translate(${margin.left}, ${margin.top})`">
        <g class="fjs-brush"></g>
        <g class="fjs-pca-axis fjs-x-axis" :transform="`translate(0, ${padded.height})`"></g>
        <g class="fjs-pca-axis fjs-y-axis"></g>
        <text :x="padded.width / 2"
              :y="padded.height + margin.bottom / 2"
              text-anchor="middle">
          Principal Component 1
        </text>
        <text text-anchor="middle"
              :transform="`translate(${- this.margin.left / 2}, ${this.padded.height / 2})rotate(-90)`">
          Principal Component 2
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
          loadings: []
        },
        categoryColors: d3.schemeCategory10,
        subsetColors: d3.schemeCategory10.slice().reverse(),
        selectedPoints: [],
        tweened: {
          points: [],
          loadings: []
        },
        hasSetFilter: false
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
          whiten: false,
          id_filter: this.idFilter,
          subsets: store.getters.subsets
        }
      },
      validArgs () {
        return this.featureData.length > 1
      },
      margin () {
        const left = this.width / 20
        const top = 10
        const right = 10
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
          .domain(d3.extent(this.results.data.map(d => d['0'])))
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain(d3.extent(this.results.data.map(d => d['1'])))
          .range([this.padded.height, 0])
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
            x1: this.scales.x(0),
            y1: this.scales.y(0),
            x2: this.scales.x(d[0]),
            y2: this.scales.y(d[1]),
            feature: d.feature
          }
        })
      },
      categories () {
        return [...new Set(this.results.data.map(d => d.category))]
      },
      axis () {
        const x = d3.axisTop(this.scales.x)
        const y = d3.axisRight(this.scales.y)
        return { x, y }
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
            d3.select(this.$el.querySelector('.fjs-x-axis')).call(newAxis.x)
            d3.select(this.$el.querySelector('.fjs-y-axis')).call(newAxis.y)
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
</style>

<!--CSS for dynamically created components-->
<style lang="sass">
  .fjs-pca-axis
    shape-rendering: crispEdges
    .tick
      shape-rendering: crispEdges
    line
      stroke: #c8c8c8
    text
      font-size: 0.75em
</style>
