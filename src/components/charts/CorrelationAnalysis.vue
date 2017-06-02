<template>
  <div :class="`fjs-vm-root fjs-vm-root-${this._uid}`">
    <div class="fjs-data-box-container">
      <data-box class="fjs-data-box"
                header="X and Y variables"
                dataType="numerical"
                v-on:update="update_xyData">
      </data-box>
      <data-box class="fjs-data-box"
                header="Annotations"
                dataType="categorical"
                v-on:update="update_annotationData">
      </data-box>
    </div>

    <div class="fjs-parameter-container">
      <span>{{ error }}</span>
      <fieldset class="fjs-correlation-method">
        <legend>Correlation Method</legend>
        <input type="radio" id="fjs-param-method-1" value="pearson" v-model="params.method">
        <label for="fjs-param-method-1">Pearson</label>
        <input type="radio" id="fjs-param-method-2" value="spearman" v-model="params.method">
        <label for="fjs-param-method-2">Spearman</label>
        <input type="radio" id="fjs-param-method-3" value="kendall" v-model="params.method">
        <label for="fjs-param-method-3">Kendall</label>
      </fieldset>
    </div>

    <div class="fjs-vis-container">
      <svg :width="width"
           :height="height">
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
                :shape="point.subset"
                :cx="scales.x(point.x)"
                :cy="scales.y(point.y)"
                :size="9"
                v-svgtooltip="point.tooltip"
                :fill="annotationColors[annotations.indexOf(point.annotation) % annotationColors.length]"
                :key="`${point.id}-${scales.x(point.x)}-${scales.y(point.y)}`"
                v-for="point in shownPoints.all">
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
      <div class="fjs-table-container">
        <table class="fjs-stats-table">
          <caption>Selected points</caption>
          <tr>
            <td>Coefficient</td>
            <td>{{ tmpAnalysisResults.coef }}</td>
          </tr>
          <tr>
            <td>p-value</td>
            <td>{{ tmpAnalysisResults.p_value }}</td>
          </tr>
          <tr>
            <td>Method</td>
            <td>{{ tmpAnalysisResults.method }}</td>
          </tr>
          <tr>
            <td>#Points</td>
            <td>{{ tmpPoints.all.length }}</td>
          </tr>
        </table>
        <table class="fjs-stats-table"
               v-for="(stats, i) in tmpAnalysisResults.subsets">
          <caption>Subset: {{ i + 1 }}</caption>
          <tr>
            <td>Coefficient</td>
            <td>{{ stats.coef }}</td>
          </tr>
          <tr>
            <td>p-value</td>
            <td>{{ stats.p_value }}</td>
          </tr>
          <tr>
            <td>Method</td>
            <td>{{ tmpAnalysisResults.method }}</td>
          </tr>
          <tr>
            <td>#Points</td>
            <td>{{ tmpPoints.subsets.filter(d => d === i).length }}</td>
          </tr>
        </table>
      </div>
    </div>
    <task-view></task-view>
  </div>
</template>


<script>
  import DataBox from '../DataBox.vue'
  import Icon from '../Icon.vue'
  import store from '../../store/store'
  import requestHandling from '../methods/request-handling'
  import * as d3 from 'd3'
  import svgtooltip from '../directives/v-svgtooltip'
  import { TweenLite } from 'gsap'
  import TaskView from '../TaskView.vue'
  export default {
    name: 'correlation-analysis',
    data () {
      return {
        error: '',
        width: 0,
        height: 0,
        xyData: [],
        annotationData: [],
        annotationColors: d3.schemeCategory10,
        params: {
          method: 'pearson'
        },
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
          id_filter: this.selectedPoints.map(d => d.id),
          method: this.params.method,
          subsets: store.getters.subsets,
          annotations: this.annotationData.map(d => `$${d}$`)
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
      annotations () {
        return this.shownPoints.annotations.filter((d, i, arr) => arr.indexOf(d) === i)  // make unique
      },
      shownPoints () {
        const xs = []
        const ys = []
        const ids = []
        const subsets = []
        const annotations = []
        let all = []
        if (!this.shownAnalysisResults.init) {
          all = this.shownAnalysisResults.data.map(d => {
            const x = d[this.shownAnalysisResults.x_label]
            const y = d[this.shownAnalysisResults.y_label]
            const id = d.id
            const subset = d.subset
            const annotation = d.annotation
            const tooltip = {
              [this.shownAnalysisResults.x_label]: x,
              [this.shownAnalysisResults.y_label]: y,
              subset
            }
            if (typeof annotation !== 'undefined') {
              tooltip.annotation = annotation
            }
            xs.push(x)
            ys.push(y)
            ids.push(id)
            subsets.push(subset)
            annotations.push(annotation)
            return {x, y, id, subset, annotation, tooltip}
          })
        }
        return { xs, ys, ids, subsets, annotations, all }
      },
      tmpPoints () {
        const xs = []
        const ys = []
        const ids = []
        const subsets = []
        const annotations = []
        let all = []
        if (!this.tmpAnalysisResults.init) {
          all = this.tmpAnalysisResults.data.map(d => {
            const x = d[this.tmpAnalysisResults.x_label]
            const y = d[this.tmpAnalysisResults.y_label]
            const id = d.id
            const subset = d.subset
            const annotation = d.annotation
            xs.push(x)
            ys.push(y)
            ids.push(id)
            subsets.push(subset)
            annotations.push(annotation)
            return {x, y, id, subset, annotation}
          })
        }
        return { xs, ys, ids, subsets, annotations, all }
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
              }
            }
            store.dispatch('setFilter', {filter: 'ids', value: this.selectedPoints.map(d => d.id)})
          })
      },
      histograms () {
        const BINS = 14
        let xBins = []
        let yBins = []
        if (!this.tmpAnalysisResults.init) {
          const [xMin, xMax] = d3.extent(this.tmpPoints.xs)
          const [yMin, yMax] = d3.extent(this.tmpPoints.ys)
          const xThresholds = d3.range(xMin, xMax, (xMax - xMin) / BINS)
          const yThresholds = d3.range(yMin, yMax, (yMax - yMin) / BINS)
          xBins = d3.histogram()
            .domain([xMin, xMax])
            .thresholds(xThresholds)(this.tmpPoints.xs)
          yBins = d3.histogram()
            .domain([yMin, yMax])
            .thresholds(yThresholds)(this.tmpPoints.ys)
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
      'args': {
        handler: function (newArgs, oldArgs) {
          // if our data selection change we will want to re-initialize the current view
          const init = newArgs.x !== oldArgs.x ||
            newArgs.y !== oldArgs.y ||
            JSON.stringify(newArgs.annotations) !== JSON.stringify(oldArgs.annotations)
          const args = this.args
          args.id_filter = init ? [] : args.id_filter
          if (!this.disabled) {
            this.runAnalysisWrapper({init, args})
          }
        }
      },
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
            // FIXME: This will probably not work because args is a computed property, not static data
            this.args.id_filter = newIDFilter
          }
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
      DataBox,
      Icon,
      TaskView
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
            const data = JSON.parse(results.data)
            results.data = Object.keys(data).map(key => data[key])
            if (init) {
              this.shownAnalysisResults = results
              this.tmpAnalysisResults = results
            } else {
              this.tmpAnalysisResults = results
            }
          })
          .catch(error => console.error(error))
          .then(this.handleResize)
      },
      handleResize () {
        const container = this.$el.querySelector(`.fjs-vm-root-${this._uid} .fjs-vis-container svg`)
        // noinspection JSSuspiciousNameCombination
        this.height = container.clientWidth
        this.width = container.clientWidth
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
    display: flex
    flex-direction: column

    .fjs-data-box-container
      height: 160px
      display: flex
      justify-content: space-around

    .fjs-parameter-container
      text-align: center
      .fjs-correlation-method
        width: 0
        margin: auto
        white-space: nowrap


    .fjs-vis-container
      flex: 1
      display: flex
      svg
        flex: 1
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
        .fjs-scatterplot-point
          stroke-width: 0
          shape-rendering: crispEdges
        .fjs-scatterplot-point:hover
          fill: #f00
        .fjs-brush
          stroke-width: 0
      .fjs-table-container
        width: 200px
        display: flex
        flex-direction: column
        .fjs-stats-table
          margin: 5px
          border-spacing: 0
          border-collapse: collapse
          font-size: 14px
          tr:nth-child(even)
            background-color: #ddd
          td, th
            max-width: 100px
            overflow: hidden
            text-overflow: ellipsis
            white-space: nowrap
            border: 1px #ccc solid
            border-collapse: collapse
            padding: 5px
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
