<template>
  <div :class="`fjs-vm-root fjs-vm-root-${this._uid}`">

    <div class="fjs-data-box-section">
      <data-box header="X and Y variables"
                dataType="numerical"
                v-on:update="update_xyData">
      </data-box>
      <data-box header="Annotations"
                dataType="categorical"
                v-on:update="update_annotationData">
      </data-box>
    </div>

    <div class="fjs-controls-section">
      <button class="fjs-run-analysis-btn"
              type="button"
              @click="runAnalysisWrapper({init: true, args})"
              :disabled="disabled">&#9654;</button><br/>
      <br/>
      <span>{{ error }}</span>
    </div>

    <div class="fjs-visualisation-section">
      <table class="fjs-stats-table" v-show="!shownAnalysisResults.init">
        <tr>
          <td>Corr. Coef.</td>
          <td>{{ tmpAnalysisResults.coef }}</td>
        </tr>
        <tr>
          <td>p-value</td>
          <td>{{ tmpAnalysisResults.p_value }}</td>
        </tr>
        <tr>
          <td>Correlation statistic</td>
          <td>{{ tmpAnalysisResults.method }}</td>
        </tr>
        <tr>
          <td>#Selected points</td>
          <td>{{ tmpPoints.all.length }}</td>
        </tr>
        <tr>
          <td>#Displayed points</td>
          <td>{{ shownPoints.all.length }}</td>
        </tr>
      </table>
      <svg :width="width"
           :height="height"
           v-show="!shownAnalysisResults.init">
        <g :transform="`translate(${margin.left}, ${margin.top})`">
          <g class="fjs-corr-axis fjs-x-axis-1" :transform="`translate(0, ${padded.height})`"></g>
          <g class="fjs-corr-axis fjs-x-axis-2"></g>
          <g class="fjs-corr-axis fjs-y-axis-1"></g>
          <g class="fjs-corr-axis fjs-y-axis-2" :transform="`translate(${padded.width}, 0)`"></g>
          <g class="fjs-brush"></g>
          <text :x="padded.width / 2"
                y="-10"
                text-anchor="middle"
                font-size="16">
            {{ shownAnalysisResults.x_label }}
          </text>
          <text :x="padded.width + 10"
                :y="padded.height / 2"
                text-anchor="middle"
                font-size="16"
                :transform="`rotate(90 ${padded.width + 10} ${padded.height / 2})`">
            {{ shownAnalysisResults.y_label }}
          </text>
          <icon class="fjs-scatterplot-point"
                shape="diamond"
                :cx="scales.x(point.x)"
                :cy="scales.y(point.y)"
                :size="10"
                v-for="point in shownPoints.all"
                :key="point.id"
                v-svgtooltip="point.tooltip">
          </icon>
          <line class="fjs-lin-reg-line"
                :x1="tweened.regLine.x1"
                :x2="tweened.regLine.x2"
                :y1="tweened.regLine.y1"
                :y2="tweened.regLine.y2"
                v-svgtooltip="regLine.tooltip">
          </line>
          <rect class="fjs-histogram-rect"
                :x="attr.x"
                :y="attr.y"
                :width="attr.width"
                :height="attr.height"
                v-for="attr in tweened.histogramAttr.xAttr">
          </rect>
          <rect class="fjs-histogram-rect"
                :x="attr.x"
                :y="attr.y"
                :width="attr.width"
                :height="attr.height"
                v-for="attr in tweened.histogramAttr.yAttr">
          </rect>
        </g>
      </svg>
    </div>

  </div>
</template>


<script>
  import DataBox from '../DataBox.vue'
  import Icon from '../Icon.vue'
  import store from '../../store/store'
  import types from '../../store/mutation-types'
  import requestHandling from '../methods/request-handling'
  import * as d3 from 'd3'
  import svgtooltip from '../directives/v-svgtooltip'
  import { TweenLite } from 'gsap'
  import $ from 'jquery'
  export default {
    name: 'correlation-analysis',
    data () {
      return {
        error: '',
        width: 0,
        height: 0,
        xyData: [],
        annotationData: [],
        shownAnalysisResults: {
          init: true,  // will disappear after being initially set
          coef: 0,
          p_value: 0,
          slope: 0,
          intercept: 0,
          method: '',
          x_label: '',
          y_label: '',
          get data () {
            return {
              id: [],
              [this.x_label]: [],
              [this.y_label]: []
            }
          }
        },
        tmpAnalysisResults: {
          init: true,  // will disappear after being initially set
          coef: 0,
          p_value: 0,
          slope: 0,
          intercept: 0,
          method: '',
          x_label: '',
          y_label: '',
          get data () {
            return {
              id: [],
              [this.x_label]: [],
              [this.y_label]: []
            }
          }
        },
        selectedPoints: [],
        tweened: {
          regLine: {},
          histogramAttr: {
            xAttr: [],
            yAttr: []
          }
        }
      }
    },
    computed: {
      idFilter () {
        return store.getters.filter('ids')
      },
      disabled () {
        return this.xyData.length !== 2
      },
      args () {
        return {
          x: `$${this.xyData[0]}$`,
          y: `$${this.xyData[1]}$`,
          ids: this.selectedPoints.map(d => d.id)
        }
      },
      margin () {
        const left = this.width / 3
        const top = 50
        const right = 50
        const bottom = this.height / 3
        return { left, top, right, bottom }
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return { width, height }
      },
      shownPoints () {
        const xs = []
        const ys = []
        const ids = []
        let all = []
        if (!this.shownAnalysisResults.init) {
          all = Object.keys(this.shownAnalysisResults.data.id).map(key => {
            const x = this.shownAnalysisResults.data[this.shownAnalysisResults.x_label][key]
            const y = this.shownAnalysisResults.data[this.shownAnalysisResults.y_label][key]
            const id = this.shownAnalysisResults.data.id[key]
            const tooltip = {[this.shownAnalysisResults.x_label]: x, [this.shownAnalysisResults.y_label]: y}
            xs.push(x)
            ys.push(y)
            ids.push(id)
            return {x, y, id, tooltip}
          })
        }
        return { xs, ys, ids, all }
      },
      tmpPoints () {
        const xs = []
        const ys = []
        const ids = []
        let all = []
        if (!this.tmpAnalysisResults.init) {
          all = Object.keys(this.tmpAnalysisResults.data.id).map(key => {
            const x = this.tmpAnalysisResults.data[this.tmpAnalysisResults.x_label][key]
            const y = this.tmpAnalysisResults.data[this.tmpAnalysisResults.y_label][key]
            const id = this.tmpAnalysisResults.data.id[key]
            xs.push(x)
            ys.push(y)
            ids.push(id)
            return {x, y, id}
          })
        }
        return { xs, ys, ids, all }
      },
      scales () {
        const x = d3.scaleLinear()
          .domain((() => {
            const xExtent = d3.extent(this.shownPoints.xs)
            const xPadding = (xExtent[1] - xExtent[0]) / 10
            return [xExtent[0] - xPadding, xExtent[1] + xPadding]
          })())
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain((() => {
            const yExtent = d3.extent(this.shownPoints.ys)
            const yPadding = (yExtent[1] - yExtent[0]) / 10
            return [yExtent[0] - yPadding, yExtent[1] + yPadding]
          })())
          .range([this.padded.height, 0])
        return { x, y }
      },
      tmpScales () {
        const x = d3.scaleLinear()
          .domain(d3.extent(this.tmpPoints.xs))
          .range([this.scales.x(d3.min(this.tmpPoints.xs)), this.scales.x(d3.max(this.tmpPoints.xs))])
        const y = d3.scaleLinear()
          .domain(d3.extent(this.tmpPoints.ys))
          .range([this.scales.y(this.tmpPoints.max), this.scales.x(this.tmpPoints.min)])
        return { x, y }
      },
      axis () {
        const x1 = d3.axisTop(this.scales.x)
        const y1 = d3.axisRight(this.scales.y)
        const x2 = d3.axisBottom(this.scales.x)
          .tickSizeInner(this.padded.height - 23)
          .tickFormat('')
        const y2 = d3.axisLeft(this.scales.y)
          .tickSizeInner(this.padded.width - 23)
          .tickFormat('')
        return { x1, x2, y1, y2 }
      },
      regLine () {
        if (this.tmpAnalysisResults.init) {
          return { x1: 0, x2: 0, y1: 0, y2: 0 }
        }
        const minX = d3.min(this.tmpPoints.xs)
        const maxX = d3.max(this.tmpPoints.xs)
        let x1 = this.scales.x(minX)
        let y1 = this.scales.y(this.tmpAnalysisResults.intercept + this.tmpAnalysisResults.slope * minX)
        let x2 = this.scales.x(maxX)
        let y2 = this.scales.y(this.tmpAnalysisResults.intercept + this.tmpAnalysisResults.slope * maxX)

        x1 = x1 < 0 ? 0 : x1
        x1 = x1 > this.width ? this.width : x1

        x2 = x2 < 0 ? 0 : x2
        x2 = x2 > this.width ? this.width : x2

        y1 = y1 < 0 ? 0 : y1
        y1 = y1 > this.height ? this.height : y1

        y2 = y2 < 0 ? 0 : y2
        y2 = y2 > this.height ? this.height : y2

        const tooltip = {Slope: this.tmpAnalysisResults.slope, Intercept: this.tmpAnalysisResults.intercept}

        return { x1, x2, y1, y2, tooltip }
      },
      brush () {
        return d3.brush()
          .extent([[0, 0], [this.padded.width, this.padded.height]])
          .on('end', () => {
            this.error = ''
            if (!d3.event.selection) {
              this.selectedPoints = []
              this.runAnalysisWrapper({init: false, args: this.args})
            } else {
              const [[x0, y0], [x1, y1]] = d3.event.selection
              this.selectedPoints = this.shownPoints.all.filter(d => {
                const x = this.scales.x(d.x)
                const y = this.scales.y(d.y)
                return x0 <= x && x <= x1 && y0 <= y && y <= y1
              })
              if (this.selectedPoints.length > 0 && this.selectedPoints.length < 3) {
                this.error = 'Selection must be zero (everything is selected) or greater than two.'
                return
              } else {
                this.runAnalysisWrapper({init: false, args: this.args})
              }
            }
            store.commit(types.SET_FILTER, {filter: 'ids', value: this.selectedPoints.map(d => d.id)})
          })
      },
      histograms () {
        const BINS = 14
        let xBins = []
        let yBins = []
        if (!this.tmpAnalysisResults.init) {
          const [xMin, xMax] = this.tmpScales.x.domain()
          const [yMin, yMax] = this.tmpScales.y.domain()
          const xThresholds = d3.range(xMin, xMax, (xMax - xMin) / BINS)
          const yThresholds = d3.range(yMin, yMax, (yMax - yMin) / BINS)
          xBins = d3.histogram()
            .domain(this.tmpScales.x.domain())
            .thresholds(xThresholds)(this.tmpPoints.xs)
          yBins = d3.histogram()
            .domain(this.tmpScales.y.domain())
            .thresholds(yThresholds)(this.tmpPoints.ys)
        }
        return { xBins, yBins }
      },
      histogramScales () {
        const xExtent = d3.extent(this.histograms.xBins.map(d => d.length))
        const yExtent = d3.extent(this.histograms.yBins.map(d => d.length))
        // no, I didn't mix up xBins and yBins.
        const x = d3.scaleLinear()
          .domain(yExtent)
          .range([yExtent[0] ? 10 : 0, this.margin.left])
        const y = d3.scaleLinear()
          .domain(xExtent)
          .range([xExtent[0] ? 10 : 0, this.margin.bottom])
        return { x, y }
      },
      histogramAttr () {
        const xAttr = this.histograms.xBins.map(d => {
          return {
            x: this.scales.x(d.x0),
            y: this.padded.height + 1,
            width: this.scales.x(d.x1) - this.scales.x(d.x0),
            height: this.histogramScales.y(d.length)
          }
        })
        const yAttr = this.histograms.yBins.map(d => {
          return {
            x: -this.histogramScales.x(d.length),
            y: this.scales.y(d.x1),
            width: this.histogramScales.x(d.length),
            height: this.scales.y(d.x0) - this.scales.y(d.x1)
          }
        })

        return { xAttr, yAttr }
      }
    },
    watch: {
      'axis': {
        handler: function (newAxis) {
          d3.select(`.fjs-vm-root-${this._uid} .fjs-x-axis-1`).call(newAxis.x1)
          d3.select(`.fjs-vm-root-${this._uid} .fjs-x-axis-2`).call(newAxis.x2)
          d3.select(`.fjs-vm-root-${this._uid} .fjs-y-axis-1`).call(newAxis.y1)
          d3.select(`.fjs-vm-root-${this._uid} .fjs-y-axis-2`).call(newAxis.y2)
        }
      },
      'brush': {
        handler: function (newBrush) {
          d3.select(`.fjs-vm-root-${this._uid} .fjs-brush`).call(newBrush)
        }
      },
      'regLine': {
        handler: function (newRegLine, oldRegLine) {
          const coords = oldRegLine
          const targetCoords = newRegLine
          targetCoords.onUpdate = () => { this.tweened.regLine = coords }
          TweenLite.to(coords, 0.5, targetCoords)
        }
      },
      'histogramAttr': {
        handler: function (newHistogramAttr, oldHistogramAttr) {
          let i = Math.max.apply(null, [newHistogramAttr.xAttr.length, oldHistogramAttr.xAttr.length])
          let j = Math.max.apply(null, [newHistogramAttr.yAttr.length, oldHistogramAttr.yAttr.length])

          while (i--) {
            const ii = i
            let xAttr = oldHistogramAttr.xAttr[i] ? oldHistogramAttr.xAttr[i]
              : { x: this.padded.width / 2, y: this.padded.height, width: 0, height: 0 }
            const xAttrTarget = newHistogramAttr.xAttr[i] ? newHistogramAttr.xAttr[i] : { width: 0 }
            xAttrTarget.onUpdate = () => { this.tweened.histogramAttr.xAttr[ii] = xAttr }
            TweenLite.to(xAttr, 0.5, xAttrTarget)
          }

          while (j--) {
            const jj = j
            const yAttr = oldHistogramAttr.yAttr[j] ? oldHistogramAttr.yAttr[j]
              : { x: 0, y: this.padded.height / 2, width: 0, height: 0 }
            const yAttrTarget = newHistogramAttr.yAttr[j] ? newHistogramAttr.yAttr[j] : { height: 0 }
            yAttrTarget.onUpdate = () => { this.tweened.histogramAttr.yAttr[jj] = yAttr }
            TweenLite.to(yAttr, 0.5, yAttrTarget)
          }
        }
      },
      'idFilter': {
        handler: function (newIDFilter) {
          const isFiltered = (newIDFilter.length === this.selectedPoints.length) &&
            this.selectedPoints.map(d => d.id).every(id => newIDFilter.indexOf(id) !== -1)
          if (!isFiltered) {
            const args = this.args
            args.ids = newIDFilter
            this.runAnalysisWrapper({init: false, args})
          }
        }
      }
    },
    mounted () {
      window.addEventListener('resize', this.onResize)
      this.onResize()  // initial call
      // saves us the manual initialization of tmpAnalysisResults
      this.tmpAnalysisResults = JSON.parse(JSON.stringify(this.shownAnalysisResults))
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.onResize)
    },
    components: {
      DataBox,
      Icon
    },
    mixins: [
      requestHandling,
      svgtooltip
    ],
    methods: {
      runAnalysisWrapper ({init, args}) {
        // function made available via requestHandling mixin
        this.runAnalysis({task_name: 'compute-correlation', args})
          .then(response => {
            const results = JSON.parse(response)
            results.data = JSON.parse(results.data)
            if (init) {
              this.shownAnalysisResults = results
              this.tmpAnalysisResults = results
            } else {
              this.tmpAnalysisResults = results
            }
          })
          .catch(error => console.error(error))
      },
      onResize () {
        const tableHeight = $(this.$el.querySelector(`.fjs-vm-root-${this._uid} .fjs-stats-table`)).outerHeight(true)
        const section = this.$el.querySelector(`.fjs-vm-root-${this._uid} .fjs-visualisation-section`)
        const height = section.clientHeight - tableHeight
        const width = section.clientWidth
        this.height = height > width ? width : height // we want to have a square
        // noinspection JSSuspiciousNameCombination
        this.width = this.height
      },
      update_xyData (ids) {
        this.xyData = ids
      },
      update_annotationData (ids) {
        this.annotationData = ids
      }
    }
  }
</script>


<style lang="sass" scoped>
  @import './src/assets/base.sass'

  *
    font-family: Roboto, sans-serif

  .fjs-vm-root
    height: 100%
    width: 100%

    .fjs-data-box-section
      text-align: center
      height: 15%
      > *
        display: inline-block

    .fjs-controls-section
      height: 5%
      text-align: center
      .fjs-run-analysis-btn
        margin: 10px
        width: 100px
        height: 30px
        box-shadow: 2px 2px 4px 0 #999
        font-size: 20px
      .fjs-run-analysis-btn:not([disabled]):hover
        cursor: pointer

    .fjs-visualisation-section
      height: 80%
      .fjs-lin-reg-line
        stroke: #ff5e00
        stroke-width: 4px
      .fjs-lin-reg-line:hover
        opacity: 0.4
      .fjs-histogram-rect
        stroke: #fff
        shape-rendering: crispEdges
        stroke-width: 0px
        fill: #ffd100
      .fjs-stats-table
        margin: 5px
        border-spacing: 0
        border-collapse: collapse
        font-size: 14px
        float: right
      .fjs-stats-table tr:nth-child(even)
        background-color: #ddd
      .fjs-stats-table, .fjs-stats-table td, .fjs-stats-table th
        border: 1px #ccc solid
        border-collapse: collapse
        padding: 5px
      .fjs-scatterplot-point
        fill: #000
        shape-rendering: crispEdges
      .fjs-scatterplot-point:hover
        fill: #f00
      .fjs-brush
        stroke-width: 0
</style>

<!--CSS for dynamically created components-->
<style lang="sass">
  @import './src/assets/svgtooltip.sass'

  .fjs-corr-axis
    shape-rendering: crispEdges
    .tick
      shape-rendering: crispEdges
    line
      stroke: #999
</style>
