<template>
  <chart v-on:resize="resize">

    <control-panel class="fjs-control-panel">
      <data-box class="fjs-data-box"
                header="Numerical Variables"
                dataType="numerical,numerical_array"
                v-on:update="update_xyData">
      </data-box>
      <data-box class="fjs-data-box"
                header="Categorical Variables"
                dataType="categorical"
                v-on:update="update_categoryData">
      </data-box>
      <hr class="fjs-seperator"/>
      <fieldset class="fjs-correlation-method">
        <legend>Correlation Method</legend>
        <input type="radio" id="fjs-param-method-1" value="pearson" v-model="params.method">
        <label for="fjs-param-method-1">Pearson</label>
        <br/>
        <input type="radio" id="fjs-param-method-2" value="spearman" v-model="params.method">
        <label for="fjs-param-method-2">Spearman</label>
        <br/>
        <input type="radio" id="fjs-param-method-3" value="kendall" v-model="params.method">
        <label for="fjs-param-method-3">Kendall</label>
      </fieldset>
    </control-panel>

    <svg :height="height" :width="width">
      <g :transform="`translate(${margin.left}, ${margin.top})`">
        <g class="fjs-corr-axis fjs-y-axis-2" :transform="`translate(${padded.width}, 0)`"></g>
        <g class="fjs-corr-axis fjs-x-axis-2"></g>
        <g class="fjs-corr-axis fjs-x-axis-1" :transform="`translate(0, ${padded.height})`"></g>
        <g class="fjs-corr-axis fjs-y-axis-1"></g>
        <g class="fjs-brush"></g>
        <text class="fjs-axis-label"
              :x="padded.width / 2"
              :y="-margin.top / 2"
              text-anchor="middle">
          {{ shownResults.x_label }}
        </text>
        <text class="fjs-axis-label"
              text-anchor="middle"
              :transform="`translate(${padded.width + margin.right / 2},${padded.height / 2})rotate(90)`">
          {{ shownResults.y_label }}
        </text>
        <polygon class="fjs-scatterplot-point"
                 :points="point.shape"
                 :fill="categoryColors[categories.indexOf(point.category) % categoryColors.length]"
                 :title="point.tooltip"
                 v-tooltip
                 v-for="point in points">
        </polygon>
        <line class="fjs-lin-reg-line"
              :x1="regLine.x1"
              :x2="regLine.x2"
              :y1="regLine.y1"
              :y2="regLine.y2"
              :title="regLine.tooltip"
              v-tooltip="{followCursor: true}">
        </line>
        <rect class="fjs-histogram fjs-histogram-bottom"
              :width="bin.width"
              :height="bin.height"
              :x="bin.x"
              :y="bin.y"
              v-for="bin in histogram.bottom">
        </rect>
        <rect class="fjs-histogram fjs-histogram-left"
              :width="bin.width"
              :height="bin.height"
              :x="bin.x"
              :y="bin.y"
              v-for="bin in histogram.left">
        </rect>
      </g>
    </svg>

  </chart>
</template>

<script>
  import DataBox from '../components/DataBox.vue'
  import ControlPanel from '../components/ControlPanel.vue'
  import { getPolygonPointsForSubset } from '../mixins/utils'
  import Chart from '../components/Chart.vue'
  import store from '../../store/store'
  import runAnalysis from '../mixins/run-analysis'
  import * as d3 from 'd3'
  import tooltip from '../directives/tooltip.js'
  import deepFreeze from 'deep-freeze-strict'
  export default {
    name: 'correlation-analysis',
    data () {
      return {
        error: '',
        width: 0,
        height: 0,
        xyData: [],
        categoryData: [],
        categoryColors: d3.schemeCategory10,
        params: {
          method: 'pearson'
        },
        shownResults: {  // initially computed
          coef: 0,
          p_value: 0,
          slope: 0,
          intercept: 0,
          method: 'pearson',
          x_label: '',
          y_label: '',
          data: []
        },
        tmpResults: {  // on-the-fly computed
          coef: 0,
          p_value: 0,
          slope: 0,
          intercept: 0,
          method: 'pearson',
          x_label: '',
          y_label: '',
          data: []
        },
        selectedPoints: [],
        hasSetFilter: false
      }
    },
    computed: {
      idFilter () {
        return store.getters.filter('ids')
      },
      validArgs () {
        return this.xyData.length === 2
      },
      args () {
        return {
          x: this.xyData[0],
          y: this.xyData[1],
          id_filter: this.idFilter,
          method: this.params.method,
          subsets: store.getters.subsets,
          categories: this.categoryData
        }
      },
      margin () {
        const left = this.width / 4
        const top = this.height / 20
        const right = this.width / 20
        const bottom = this.height / 4
        return {left, top, right, bottom}
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return {width, height}
      },
      categories () {
        return [...new Set(this.shownResults.data.map(d => d.category))]
      },
      points () {
        return this.shownResults.data.map(d => {
          const x = this.scales.x(d.value_x)
          const y = this.scales.y(d.value_y)
          const id = d.id
          const subset = d.subset
          const shape = getPolygonPointsForSubset({cx: x, cy: y, size: this.width / 150, subset: subset})
          const category = d.category
          let tooltip = `
<div>
  <p>${d.feature_x}: ${x}</p>
  <p>${d.feature_y}: ${y}</p>
  <p>Subset: ${subset}</p>
  ${typeof category !== 'undefined' ? '<p>Category: ' + category + '</p>' : ''}
</div>
`
          return {x, y, id, shape, subset, category, tooltip}
        })
      },
      scales () {
        const x = d3.scaleLinear()
          .domain((() => {
            const xExtent = d3.extent(this.shownResults.data.map(d => d.value_x))
            const xPadding = (xExtent[1] - xExtent[0]) / 10
            return [xExtent[0] - xPadding, xExtent[1] + xPadding]
          })())
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain((() => {
            const yExtent = d3.extent(this.shownResults.data.map(d => d.value_y))
            const yPadding = (yExtent[1] - yExtent[0]) / 10
            return [yExtent[0] - yPadding, yExtent[1] + yPadding]
          })())
          .range([this.padded.height, 0])
        return {x, y}
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
        return {x1, x2, y1, y2}
      },
      regLine () {
        const xValues = this.tmpResults.data.map(d => d.value_x)
        const minX = d3.min(xValues)
        const maxX = d3.max(xValues)
        let x1 = this.scales.x(minX) || 0
        let y1 = this.scales.y(this.tmpResults.intercept + this.tmpResults.slope * minX) || 0
        let x2 = this.scales.x(maxX) || 0
        let y2 = this.scales.y(this.tmpResults.intercept + this.tmpResults.slope * maxX) || 0

        x1 = x1 < 0 ? 0 : x1
        x1 = x1 > this.width ? this.width : x1

        x2 = x2 < 0 ? 0 : x2
        x2 = x2 > this.width ? this.width : x2

        y1 = y1 < 0 ? 0 : y1
        y1 = y1 > this.height ? this.height : y1

        y2 = y2 < 0 ? 0 : y2
        y2 = y2 > this.height ? this.height : y2

        const tooltip = `
<div>
  <p>Slope: ${this.tmpResults.slope}</p>
  <p>Intercept: ${this.tmpResults.intercept}</p>
</div>
`
        return {x1, x2, y1, y2, tooltip}
      },
      brush () {
        return d3.brush()
          .extent([[0, 0], [this.padded.width, this.padded.height]])
          .on('end', () => {
            this.error = ''
            if (!d3.event.selection) {
              if (this.selectedPoints.length === 0) {
                return
              }
              this.selectedPoints = []
            } else {
              const [[x0, y0], [x1, y1]] = d3.event.selection
              this.selectedPoints = this.points.filter(d => {
                return x0 <= d.x && d.x <= x1 && y0 <= d.y && d.y <= y1
              })
              if (this.selectedPoints.length > 0 && this.selectedPoints.length < 3) {
                this.error = 'Selection must be zero (everything is selected) or greater than two.'
                return
              }
            }
            store.dispatch('setFilter', {filter: 'ids', value: this.selectedPoints.map(d => d.id)})
            this.hasSetFilter = true
          })
      },
      histogramBins () {
        const BINS = 14
        let xBins = []
        let yBins = []
        const xValues = this.tmpResults.data.map(d => d.value_x)
        const yValues = this.tmpResults.data.map(d => d.value_y)
        const [xMin, xMax] = d3.extent(xValues)
        const [yMin, yMax] = d3.extent(yValues)
        const xThresholds = d3.range(xMin, xMax, (xMax - xMin) / BINS)
        const yThresholds = d3.range(yMin, yMax, (yMax - yMin) / BINS)
        if (xValues.length) {
          xBins = d3.histogram()
            .domain([xMin, xMax])
            .thresholds(xThresholds)(xValues)
        }
        if (yValues.length) {
          yBins = d3.histogram()
            .domain([yMin, yMax])
            .thresholds(yThresholds)(yValues)
        }
        return {xBins, yBins}
      },
      histogramScales () {
        const xExtent = d3.extent(this.histogramBins.xBins.map(d => d.length))
        const yExtent = d3.extent(this.histogramBins.yBins.map(d => d.length))
        // no, I didn't mix up x and y.
        const x = d3.scaleLinear()
          .domain(yExtent)
          .range([yExtent[0] ? 10 : 0, this.margin.left])
        const y = d3.scaleLinear()
          .domain(xExtent)
          .range([xExtent[0] ? 10 : 0, this.margin.bottom])
        return {x, y}
      },
      histogram () {
        const bottom = this.histogramBins.xBins.map(d => {
          return {
            x: this.scales.x(d.x0),
            y: this.padded.height,
            width: this.scales.x(d.x1) - this.scales.x(d.x0),
            height: this.histogramScales.y(d.length)
          }
        })
        const left = this.histogramBins.yBins.map(d => {
          return {
            x: -this.histogramScales.x(d.length),
            y: this.scales.y(d.x0),
            width: this.histogramScales.x(d.length),
            height: this.scales.y(d.x0) - this.scales.y(d.x1)
          }
        })
        return { bottom, left }
      }
    },
    // IMPORTANT: If the code within the watchers does interact with the DOM the code should be wrapped into a $nextTick
    // statement. This helps with the integration into the Vue component lifecycle. E.g.: an animation can't be
    // applied to an element that does not exist yet.
    watch: {
      'args': {
        handler: function (newArgs, oldArgs) {
          const init = newArgs.x !== oldArgs.x ||
            newArgs.y !== oldArgs.y ||
            JSON.stringify(newArgs.categories) !== JSON.stringify(oldArgs.categories) ||
            !this.hasSetFilter
          if (this.validArgs) {
            this.runAnalysisWrapper({init, args: newArgs})
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
      'brush': {
        handler: function (newBrush) {
          this.$nextTick(() => {
            d3.select(this.$el.querySelector('.fjs-brush')).call(newBrush)
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
    },
    methods: {
      runAnalysisWrapper ({init, args}) {
        // function made available via requestHandling mixin
        runAnalysis({task_name: 'compute-correlation', args})
          .then(response => {
            const results = JSON.parse(response)
            results.data = JSON.parse(results.data)
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            if (init) {
              this.shownResults = results
              this.tmpResults = results
            } else {
              this.tmpResults = results
            }
          })
          .catch(error => console.error(error))
      },
      resize ({height, width}) {
        this.height = height
        this.width = width
      },
      update_xyData (ids) {
        this.xyData = ids
      },
      update_categoryData (ids) {
        this.categoryData = ids
      }
    }
  }
</script>


<style lang="sass" scoped>
  @import '~assets/base.sass'

  .fjs-control-panel
    .fjs-correlation-method
      white-space: nowrap
      border: solid 1px #fff
      text-align: left
      border-radius: 3px
      padding: 0 0.5vw 0 0.5vw
  svg
    .fjs-lin-reg-line
      stroke: #ff5e00
      stroke-width: 0.3%
    .fjs-lin-reg-line:hover
      opacity: 0.4
    .fjs-histogram
      shape-rendering: crispEdges
      stroke: #fff
      stroke-width: 1px
      fill: #ffd100
    .fjs-scatterplot-point
      stroke-width: 0
    .fjs-scatterplot-point:hover
      fill: #f00
    .fjs-brush
      stroke-width: 0
</style>

<!--CSS for dynamically created components-->
<style lang="sass">
  .fjs-corr-axis
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
