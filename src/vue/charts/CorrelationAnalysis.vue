<template>
  <div :class="`fjs-correlation-analysis fjs-vm-uid-${this._uid}`">

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

    <div class="fjs-vis-container">
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
          <text :x="padded.width + 10"
                :y="padded.height / 2"
                text-anchor="middle"
                :transform="`rotate(90 ${padded.width + 10} ${padded.height / 2})`">
            {{ shownResults.y_label }}
          </text>
          <circle class="fjs-scatterplot-point"
                  :cx="scales.x(point.x)"
                  :cy="scales.y(point.y)"
                  r="0.4%"
                  :fill="categoryColors[categories.indexOf(point.category) % categoryColors.length]"
                  :stroke="subsetColors[point.subset]"
                  :title="point.tooltip"
                  v-tooltip
                  v-for="point in shownPoints.all">
          </circle>
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
      <div class="fjs-table-container">
        <table class="fjs-stats-table">
          <caption>Selected points</caption>
          <tr>
            <td>Coefficient</td>
            <td>{{ parseFloat(tmpResults.coef).toFixed(4) }}</td>
          </tr>
          <tr>
            <td>p-value</td>
            <td>{{ parseFloat(tmpResults.p_value).toFixed(4) }}</td>
          </tr>
          <tr>
            <td>Method</td>
            <td>{{ tmpResults.method }}</td>
          </tr>
          <tr>
            <td>#Points</td>
            <td>{{ tmpPoints.all.length }}</td>
          </tr>
        </table>
        <table class="fjs-stats-table"
               v-for="(stats, i) in tmpResults.subsets">
          <caption>Subset: {{ i + 1 }}</caption>
          <tr>
            <td>Coefficient</td>
            <td>{{ parseFloat(stats.coef).toFixed(4) }}</td>
          </tr>
          <tr>
            <td>p-value</td>
            <td>{{ parseFloat(stats.p_value).toFixed(4) }}</td>
          </tr>
          <tr>
            <td>Method</td>
            <td>{{ tmpResults.method }}</td>
          </tr>
          <tr>
            <td>#Points</td>
            <td>{{ tmpPoints.subsets.filter(function(d) { return d === i}).length }}</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
  import DataBox from '../components/DataBox.vue'
  import store from '../../store/store'
  import runAnalysis from '../mixins/run-analysis'
  import * as d3 from 'd3'
  import { TweenLite } from 'gsap'
  import tooltip from '../directives/tooltip.js'
  import deepFreeze from 'deep-freeze-strict'
  import ControlPanel from '../components/ControlPanel.vue'
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
        subsetColors: d3.schemeCategory10.slice().reverse(),
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
      categories () {
        return this.shownPoints.categories.filter((d, i, arr) => arr.indexOf(d) === i)  // make unique
      },
      shownPoints () {
        const xs = []
        const ys = []
        const ids = []
        const subsets = []
        const categories = []
        const all = this.shownResults.data.map(d => {
          const x = d[this.shownResults.x_label]
          const y = d[this.shownResults.y_label]
          const id = d.id
          const subset = d.subset
          const category = d.category
          let tooltip = `
<div>
  <p>${[this.shownResults.x_label]}: ${x}</p>
  <p>${[this.shownResults.y_label]}: ${y}</p>
  <p>Subset: ${subset}</p>
  ${typeof category !== 'undefined' ? '<p>Category: ' + category + '</p>' : ''}
</div>
`
          xs.push(x)
          ys.push(y)
          ids.push(id)
          subsets.push(subset)
          categories.push(category)
          return {x, y, id, subset, category, tooltip}
        })
        return { xs, ys, ids, subsets, categories, all }
      },
      tmpPoints () {
        const xs = []
        const ys = []
        const ids = []
        const subsets = []
        const categories = []
        const all = this.tmpResults.data.map(d => {
          const x = d[this.tmpResults.x_label]
          const y = d[this.tmpResults.y_label]
          const id = d.id
          const subset = d.subset
          const category = d.category
          xs.push(x)
          ys.push(y)
          ids.push(id)
          subsets.push(subset)
          categories.push(category)
          return {x, y, id, subset, category}
        })
        return { xs, ys, ids, subsets, categories, all }
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
          .tickSizeInner(this.padded.width - this.yAxisTickWidth - 10)
          .tickFormat('')
        return { x1, x2, y1, y2 }
      },
      regLine () {
        const minX = d3.min(this.tmpPoints.xs)
        const maxX = d3.max(this.tmpPoints.xs)
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
        const [xMin, xMax] = d3.extent(this.tmpPoints.xs)
        const [yMin, yMax] = d3.extent(this.tmpPoints.ys)
        const xThresholds = d3.range(xMin, xMax, (xMax - xMin) / BINS)
        const yThresholds = d3.range(yMin, yMax, (yMax - yMin) / BINS)
        if (this.tmpPoints.xs.length) {
          xBins = d3.histogram()
            .domain([xMin, xMax])
            .thresholds(xThresholds)(this.tmpPoints.xs)
        }
        if (this.tmpPoints.ys.length) {
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
            d3.selectAll(`.fjs-vm-uid-${this._uid} .fjs-histogram-polyline`)
              .filter('.fjs-bottom')
              .transition()
              .duration(500)
              .attr('points', newPoints.bottom)
            d3.selectAll(`.fjs-vm-uid-${this._uid} .fjs-histogram-polyline`)
              .filter('.fjs-left')
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
            d3.select(`.fjs-vm-uid-${this._uid} .fjs-x-axis-1`).call(newAxis.x1)
            d3.select(`.fjs-vm-uid-${this._uid} .fjs-x-axis-2`).call(newAxis.x2)
            d3.select(`.fjs-vm-uid-${this._uid} .fjs-y-axis-1`).call(newAxis.y1)
            d3.select(`.fjs-vm-uid-${this._uid} .fjs-y-axis-2`).call(newAxis.y2)
            const text = document.querySelector(`.fjs-vm-uid-${this._uid} .fjs-y-axis-1 text`)
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
            d3.select(`.fjs-vm-uid-${this._uid} .fjs-brush`).call(newBrush)
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
    mounted () {
      window.addEventListener('resize', this.handleResize)
      this.handleResize()
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.handleResize)
    },
    components: {
      ControlPanel,
      DataBox
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
            const data = JSON.parse(results.data)
            results.data = Object.keys(data).map(key => data[key])
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
      handleResize () {
        const container = this.$el.querySelector(`.fjs-vm-uid-${this._uid} .fjs-vis-container svg`)
        // noinspection JSSuspiciousNameCombination
        this.height = container.getBoundingClientRect().width
        this.width = container.getBoundingClientRect().width
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
  @import './src/assets/base.sass'

  *
    font-family: Roboto, sans-serif

  .fjs-correlation-analysis
    height: 100%
    width: 100%
    display: flex
    flex-direction: column
    .fjs-control-panel
      hr
        width: 100%
        margin: 10% 0 10% 0
    .fjs-correlation-method
      white-space: nowrap
      border: solid 1px #fff
      text-align: left
      border-radius: 8px
      margin: 1%

    .fjs-vis-container
      flex: 1
      display: flex
      svg
        flex: 4
        .fjs-lin-reg-line
          stroke: #ff5e00
          stroke-width: 0.4%
        .fjs-lin-reg-line:hover
          opacity: 0.4
        .fjs-histogram-polyline
          shape-rendering: crispEdges
          stroke: white
          stroke-width: 1px
          fill: #ffd100
        .fjs-scatterplot-point
          stroke-width: 1
        .fjs-scatterplot-point:hover
          fill: #f00
        .fjs-brush
          stroke-width: 0
      .fjs-table-container
        flex: 1
        display: flex
        flex-direction: column
        .fjs-stats-table
          width: 100%
          margin: 1%
          border-spacing: 0
          border-collapse: collapse
          font-size: 0.875rem
          tr:nth-child(even)
            background-color: #ddd
          td, th
            overflow: hidden
            text-overflow: ellipsis
            white-space: nowrap
            border: 1px #ccc solid
            border-collapse: collapse
            padding: 2%
</style>

<!--CSS for dynamically created components-->
<style lang="sass">
  .fjs-corr-axis
    shape-rendering: crispEdges
    .tick
      shape-rendering: crispEdges
      line
        stroke: #999
      text
        font-size: 0.875rem
</style>
