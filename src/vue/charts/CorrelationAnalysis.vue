<template>
  <chart v-on:resize="resize">

    <control-panel class="fjs-control-panel">
      <data-box class="fjs-data-box"
                header="X and Y variables"
                dataType="numerical"
                v-on:update="update_xyData">
      </data-box>
      <data-box class="fjs-data-box"
                header="Categories"
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
        <g class="fjs-corr-axis fjs-x-axis-1" :transform="`translate(0, ${padded.height})`"></g>
        <g class="fjs-corr-axis fjs-x-axis-2"></g>
        <g class="fjs-corr-axis fjs-y-axis-1"></g>
        <g class="fjs-corr-axis fjs-y-axis-2" :transform="`translate(${padded.width}, 0)`"></g>
        <g class="fjs-brush"></g>
        <text :x="padded.width / 2"
              y="-10"
              text-anchor="middle">
          {{ shownResults.x_label }}
        </text>
        <text text-anchor="middle"
              :transform="`translate(${padded.width + 10},${padded.height / 2})rotate(90)`">
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
              :title="regLine.tooltip"
              v-tooltip="{followCursor: true}"
              :x1="tweened.regLine.x1"
              :x2="tweened.regLine.x2"
              :y1="tweened.regLine.y1"
              :y2="tweened.regLine.y2">
        </line>
        <polyline class="fjs-histogram-polyline fjs-bottom" points=""></polyline>
        <polyline class="fjs-histogram-polyline fjs-left" points=""></polyline>
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
  import { TweenLite } from 'gsap'
  import tooltip from '../directives/tooltip.js'
  import deepFreeze from 'deep-freeze-strict'
  export default {
    name: 'correlation-analysis',
    data () {
      return {
        error: '',
        width: 0,
        height: 0,
        yAxisTickWidth: 0,
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
        tweened: {
          regLine: {x1: 0, x2: 0, y1: 0, y2: 0}
        }
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
          id_filter: this.selectedPoints.map(d => d.id),
          method: this.params.method,
          subsets: store.getters.subsets,
          categories: this.categoryData
        }
      },
      margin () {
        const left = this.width / 3
        const top = 20
        const right = 20
        const bottom = this.height / 3
        return { left, top, right, bottom }
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return { width, height }
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
        return { x, y }
      },
      axis () {
        const x1 = d3.axisTop(this.scales.x)
        const y1 = d3.axisRight(this.scales.y)
        const x2 = d3.axisBottom(this.scales.x)
          .tickSizeInner(this.padded.height - 23)
          .tickFormat('')
        const y2 = d3.axisLeft(this.scales.y)
          .tickSizeInner(this.padded.width - this.yAxisTickWidth - 15)
          .tickFormat('')
        return { x1, x2, y1, y2 }
      },
      regLine () {
        const xValues = this.tmpResults.data.map(d => d.value_x)
        const minX = d3.min(xValues)
        const maxX = d3.max(xValues)
        let x1 = this.scales.x(minX)
        let y1 = this.scales.y(this.tmpResults.intercept + this.tmpResults.slope * minX)
        let x2 = this.scales.x(maxX)
        let y2 = this.scales.y(this.tmpResults.intercept + this.tmpResults.slope * maxX)

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
        return { x1, x2, y1, y2, tooltip }
      },
      brush () {
        return d3.brush()
          .extent([[0, 0], [this.padded.width, this.padded.height]])
          .on('end', () => {
            this.error = ''
            if (!d3.event.selection) {
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
          })
      },
      histograms () {
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
        return { xBins, yBins }
      },
      histogramScales () {
        const xExtent = d3.extent(this.histograms.xBins.map(d => d.length))
        const yExtent = d3.extent(this.histograms.yBins.map(d => d.length))
        // no, I didn't mix up x and y.
        const x = d3.scaleLinear()
          .domain(yExtent)
          .range([yExtent[0] ? 10 : 0, this.margin.left])
        const y = d3.scaleLinear()
          .domain(xExtent)
          .range([xExtent[0] ? 10 : 0, this.margin.bottom])
        return { x, y }
      },
      histPolyPoints () {
        const bottom = this.histograms.xBins.map(d => {
          return `${this.scales.x(d.x0)},${this.padded.height + 1}, ` +
            `${this.scales.x(d.x0)},${this.padded.height + this.histogramScales.y(d.length) + 1} ` +
            `${this.scales.x(d.x1)},${this.padded.height + this.histogramScales.y(d.length) + 1} ` +
            `${this.scales.x(d.x1)},${this.padded.height + 1}`
        }).join(' ')
        const left = this.histograms.yBins.map(d => {
          return `${0},${this.scales.y(d.x0)} ` +
            `${-this.histogramScales.x(d.length)},${this.scales.y(d.x0)} ` +
            `${-this.histogramScales.x(d.length)},${this.scales.y(d.x1)} ` +
            `${0},${this.scales.y(d.x1)}`
        }).join(' ')
        return { bottom, left }
      }
    },
    // IMPORTANT: If the code within the watchers does interact with the DOM the code should be wrapped into a $nextTick
    // statement. This helps with the integration into the Vue component lifecycle. E.g.: an animation can't be
    // applied to an element that does not exist yet.
    watch: {
      'regLine': {
        handler: function (newRegLine) {
          TweenLite.to(this.tweened.regLine, 0.5, newRegLine)
        }
      },
      'histPolyPoints': {
        handler: function (newPoints) {
          this.$nextTick(() => {
            // we use d3 instead of TweenLite here because d3 can transition point paths
            d3.select(this.$el.querySelector('.fjs-histogram-polyline.fjs-bottom'))
              .transition()
              .duration(500)
              .attr('points', newPoints.bottom)
            d3.select(this.$el.querySelector('.fjs-histogram-polyline.fjs-left'))
              .transition()
              .duration(500)
              .attr('points', newPoints.left)
          })
        }
      },
      'args': {
        handler: function (newArgs, oldArgs) {
          // if our data selection change we will want to re-initialize the current view
          const init = newArgs.x !== oldArgs.x ||
            newArgs.y !== oldArgs.y ||
            JSON.stringify(newArgs.categories) !== JSON.stringify(oldArgs.categories)
          const args = this.args
          args.id_filter = init ? [] : args.id_filter
          if (this.validArgs) {
            this.runAnalysisWrapper({init, args})
          }
        }
      },
      'axis': {
        handler: function (newAxis) {
          this.$nextTick(() => {
            d3.select(this.$el.querySelector('.fjs-x-axis-1')).call(newAxis.x1)
            d3.select(this.$el.querySelector('.fjs-x-axis-2')).call(newAxis.x2)
            d3.select(this.$el.querySelector('.fjs-y-axis-1')).call(newAxis.y1)
            d3.select(this.$el.querySelector('.fjs-y-axis-2')).call(newAxis.y2)
            const text = this.$el.querySelector('.fjs-y-axis-1 text')
            if (text) {
              const width = Math.ceil(text.getBoundingClientRect().width)
              if (width !== this.yAxisTickWidth) {
                this.yAxisTickWidth = width
              }
            }
          })
        }
      },
      'brush': {
        handler: function (newBrush) {
          this.$nextTick(() => {
            d3.select(this.$el.querySelector('.fjs-brush')).call(newBrush)
          })
        }
      },
      'idFilter': {
        handler: function (newIDFilter) {
          const isFiltered = (newIDFilter.length === this.selectedPoints.length) &&
            this.selectedPoints.map(d => d.id).every(id => newIDFilter.indexOf(id) !== -1)
          if (!isFiltered) {
            // FIXME: This will probably not work because args is a computed property, not static data
            this.args.id_filter = newIDFilter
          }
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
  @import './src/assets/base.sass';
  .fjs-control-panel
    .fjs-correlation-method
      white-space: nowrap
      border: solid 1px #fff
      text-align: left
      border-radius: 8px
      margin: 1%
  svg
    .fjs-lin-reg-line
      stroke: #ff5e00
      stroke-width: 0.3%
    .fjs-lin-reg-line:hover
      opacity: 0.4
    .fjs-histogram-polyline
      shape-rendering: crispEdges
      stroke-width: 0
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
        stroke: #c8c8c8
      text
        font-size: 1em
</style>
