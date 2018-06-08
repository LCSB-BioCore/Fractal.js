<template>
    <chart v-on:resize="resize">
        <control-panel class="fjs-control-panel" name="Volcanoplot Panel">
            <data-box class="fjs-data-box"
                      header="Numerical Array Variables"
                      :data-types="['numerical_array']"
                      v-on:update="update_arrays">
            </data-box>
            <hr class="fjs-seperator"/>
            <fieldset class="fjs-fieldset">
                <legend>Differential Expression Analysis</legend>
                <div v-for="method in rankingMethods">
                    <label>
                        <input type="radio" :value="method" v-model="rankingMethod">
                        {{ method }}
                    </label>
                </div>
            </fieldset>
            <div class="fjs-axis-params">
                <label>
                    X-Axis
                    <select v-model="xAxisTransform">
                        <option :value="d" v-for="d in Object.keys(transformations)">{{ d }}</option>
                    </select>
                    <select v-model="xAxisStatistic">
                        <option :value="d" v-for="d in statistics">{{ d }}</option>
                    </select>
                </label>
                <label>
                    Y-Axis
                    <select v-model="yAxisTransform">
                        <option :value="d" v-for="d in Object.keys(transformations)">{{ d }}</option>
                    </select>
                    <select v-model="yAxisStatistic">
                        <option :value="d" v-for="d in statistics">{{ d }}</option>
                    </select>
                </label>
            </div>
            <div v-if="rankingMethod === 'DESeq2'">
                <label>
                    Minimal total reads:
                    <input type="number" v-model.number="params.min_total_row_count"/>
                </label>
            </div>
        </control-panel>
        <svg :height="height" :width="width">
            <g :transform="`translate(${margin.left}, ${margin.top})`">
                <html2svg :left="selectionTable.left" :top="selectionTable.top">
                    <table class="fjs-selection-table"
                           ref="selectionTable"
                           :style="{'min-width': brushSelection.x1 - brushSelection.x0 + 'px'}"
                           v-show="Object.keys(brushSelection).length > 0">
                        <tr id="table-colnames">
                            <td>Feature</td>
                            <td>{{ xAxisStatistic }}</td>
                            <td>{{ yAxisStatistic }}</td>
                        </tr>
                        <tr @mouseover="highlightedFeature = d.feature"
                            @mouseout="highlightedFeature = ''"
                            v-for="d in selectedFeaturesTable">
                            <td>{{ d.feature }}</td>
                            <td>{{ d.xStat }}</td>
                            <td>{{ d.yStat }}</td>
                        </tr>
                    </table>
                </html2svg>
                <g class="fjs-axis" ref="yAxis2" :transform="`translate(${padded.width}, 0)`"></g>
                <g class="fjs-axis" ref="xAxis2"></g>
                <g class="fjs-axis" ref="xAxis1" :transform="`translate(0, ${padded.height})`"></g>
                <g class="fjs-axis" ref="yAxis1"></g>
                <text class="fjs-axis-label" :transform="`translate(${padded.width / 2}, ${padded.height})`">
                    {{ `${xAxisTransform}(${xAxisStatistic})` }}
                </text>
                <text class="fjs-axis-label" :transform="`translate(${0}, ${padded.height / 2})rotate(-90)`">
                    {{ `${yAxisTransform}(${yAxisStatistic})` }}
                </text>
                <text class="fjs-axis-label" :transform="`translate(${padded.width / 2}, ${0})`">
                    {{ `${xAxisStatistic}` }}
                </text>
                <text class="fjs-axis-label" :transform="`translate(${padded.width}, ${padded.height / 2})rotate(90)`">
                    {{ `${yAxisStatistic}` }}
                </text>
                <crosshair :width="padded.width" :height="padded.height"/>
                <image :xlink:href="dataUrl" :width="padded.width" :height="padded.height"></image>
                <g class="fjs-brush" ref="brush"></g>
            </g>
        </svg>
    </chart>
</template>

<script>
  import Chart from '../components/Chart.vue'
  import ControlPanel from '../components/ControlPanel.vue'
  import DataBox from '../components/DataBox.vue'
  import RunAnalysis from '../mixins/run-analysis'
  import store from '../../store/store'
  import deepFreeze from 'deep-freeze-strict'
  import getHDPICanvas from '../../utils/high-dpi-canvas'
  import * as d3 from 'd3'
  import Crosshair from '../components/Crosshair.vue'
  import _ from 'lodash'
  import Html2svg from '../components/HTML2SVG.vue'
  import Draggable from '../components/Draggable.vue'
  export default {
    name: 'volcanoplot',
    components: {Draggable, Html2svg, Crosshair, DataBox, ControlPanel, Chart},
    mixins: [RunAnalysis],
    data () {
      return {
        height: 0,
        width: 0,
        arrays: [],
        rankingMethod: 'limma',
        rankingMethods: ['limma', 'DESeq2'],
        xAxisStatistic: '',
        yAxisStatistic: '',
        xAxisTransform: 'identity',
        yAxisTransform: '-log10',
        transformations: {
          'log2': Math.log2,
          '-log2': d => -Math.log2(d),
          'log10': Math.log10,
          '-log10': d => -Math.log10(d),
          'identity': d => d
        },
        brushSelection: {},
        selectionTable: {
          left: 0,
          top: 0
        },
        highlightedFeature: '',
        params: {
          min_total_row_count: 10
        },
        results: {
          stats: { feature: [] }
        },
        dataUrl: '',
        selectedFeatures: []
      }
    },
    computed: {
      args () {
        return {
          numerical_arrays: this.arrays,
          id_filter: [],
          params: this.params,
          ranking_method: this.rankingMethod,
          subsets: store.getters.subsets
        }
      },
      validArgs () {
        return this.args.numerical_arrays.length > 0
      },
      margin () {
        const left = this.width / 18
        const top = this.height / 18
        const right = this.width / 18
        const bottom = this.height / 18
        return {left, top, right, bottom}
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return {width, height}
      },
      pointSize () {
        return this.padded.width / 125
      },
      canvas () {
        return getHDPICanvas(this.padded.width, this.padded.height)
      },
      points () {
        const xs = []
        const ys = []
        const features = []
        this.results.stats.feature.forEach((feature, i) => {
          const x = this.transformations[this.xAxisTransform](this.results.stats[this.xAxisStatistic][i])
          const y = this.transformations[this.yAxisTransform](this.results.stats[this.yAxisStatistic][i])
          if (isFinite(x) && isFinite(y)) {
            xs.push(x)
            ys.push(y)
            features.push(feature)
          }
        })
        return { xs, ys, features }
      },
      rawScales () {
        const x = d3.scaleLinear()
          .domain((() => {
            const xExtent = d3.extent(this.results.stats[this.xAxisStatistic])
            const xPadding = (xExtent[1] - xExtent[0]) / 10
            return [xExtent[0] - xPadding, xExtent[1] + xPadding]
          })())
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain((() => {
            const yExtent = d3.extent(this.results.stats[this.yAxisStatistic])
            const yPadding = (yExtent[1] - yExtent[0]) / 10
            return [yExtent[0] - yPadding, yExtent[1] + yPadding]
          })())
          .range([0, this.padded.height])
        return { x, y }
      },
      scales () {
        const x = d3.scaleLinear()
          .domain((() => {
            const xExtent = d3.extent(this.points.xs)
            const xPadding = (xExtent[1] - xExtent[0]) / 10
            return [xExtent[0] - xPadding, xExtent[1] + xPadding]
          })())
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain((() => {
            const yExtent = d3.extent(this.points.ys)
            const yPadding = (yExtent[1] - yExtent[0]) / 10
            return [yExtent[0] - yPadding, yExtent[1] + yPadding]
          })())
          .range([this.padded.height, 0])
        return { x, y }
      },
      scaledPoints () {
        return this.points.features.map((feature, i) => {
          const x = this.scales.x(this.points.xs[i])
          const y = this.scales.y(this.points.ys[i])
          return { x, y, feature }
        })
      },
      axis () {
        const x1 = d3.axisBottom(this.scales.x)
        const y1 = d3.axisLeft(this.scales.y)
        const x2 = d3.axisTop(this.rawScales.x)
          .tickSizeOuter(-this.padded.height)
        const y2 = d3.axisRight(this.rawScales.y)
          .tickSizeOuter(-this.padded.width)
        return {x1, x2, y1, y2}
      },
      statistics () {
        if ((this.rankingMethod === 'limma') && (store.getters.subsets.length === 2)) {
          return ['logFC', 'P.Value', 'feature', 'AveExpr', 't', 'adj.P.Val', 'B']
        } else if ((this.rankingMethod === 'limma') && (store.getters.subsets.length > 2)) {
          return ['F', 'P.Value', 'feature', 'AveExpr', 'adj.P.Val']
        } else if (this.rankingMethod === 'DESeq2') {
          return ['log2FoldChange', 'pvalue', 'baseMean', 'lfcSE', 'stat', 'padj', 'feature']
        } else {
          throw new Error(`Unknown ranking method: ${this.rankingMethod}`)
        }
      },
      brush () {
        return d3.brush()
          .extent([[0, 0], [this.padded.width, this.padded.height]])
          .on('brush', () => {
            if (!d3.event.sourceEvent) { return }
            if (d3.event.selection) {
              const [[x0, y0], [x1, y1]] = d3.event.selection
              this.brushSelection = { x0, x1, y0, y1 }
              this.selectedFeatures = this.scaledPoints.filter(d => {
                return x0 <= d.x && d.x <= x1 && y0 <= d.y && d.y <= y1
              })
            }
          })
          .on('end', () => {
            if (!d3.event.selection) {
              this.brushSelection = {}
              this.selectedFeatures = []
              this.highlightedFeature = ''
            }
          })
      },
      selectedFeaturesTable () {
        return this.selectedFeatures.map(d => {
          const i = this.results.stats.feature.findIndex(e => e === d.feature)
          const feature = this.results.stats.feature[i]
          const xStat = this.results.stats[this.xAxisStatistic][i].toPrecision(4)
          const yStat = this.results.stats[this.yAxisStatistic][i].toPrecision(4)
          return { feature, xStat, yStat }
        })
      }
    },
    methods: {
      resize (width, height) {
        this.width = width
        this.height = height
      },
      update_arrays (ids) {
        this.arrays = ids
      },
      runAnalysisWrapper (args) {
        this.runAnalysis('compute-volcanoplot', args)
          .then(response => {
            const results = JSON.parse(response)
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            this.results = results
          })
          .catch(error => console.error(error))
      },
      drawPoints (points) {
        const ctx = this.canvas.getContext('2d')
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        points.forEach(d => {
          let pointSize = this.pointSize
          ctx.beginPath()
          if (d.feature === this.highlightedFeature) {
            ctx.fillStyle = '#F00'
            pointSize *= 2
          } else {
            ctx.fillStyle = '#000'
          }
          ctx.fillRect(d.x - pointSize / 2, d.y - pointSize / 2, pointSize, pointSize)
        })
        this.dataUrl = this.canvas.toDataURL('image/png')
      }
    },
    watch: {
      'args': {
        handler: function (newArgs) {
          if (this.validArgs) {
            this.runAnalysisWrapper(newArgs)
          }
        }
      },
      'scaledPoints': {
        handler: function (newPoints) {
          this.drawPoints(newPoints)
        }
      },
      'highlightedFeature': {
        handler: function () {
          this.drawPoints(this.scaledPoints)
        }
      },
      'statistics': {
        handler: function (newStats, oldStats) {
          if (!_.isEqual(newStats, oldStats)) {
            this.xAxisStatistic = newStats[0]
            this.yAxisStatistic = newStats[1]
            this.results.stats = _.zipObject(newStats, _.times(newStats.length, () => []))
          }
        },
        immediate: true
      },
      'axis': {
        handler: function (newAxis) {
          this.$nextTick(() => {
            d3.select(this.$refs.yAxis2).call(newAxis.y2)
            d3.select(this.$refs.xAxis2).call(newAxis.x2)
            d3.select(this.$refs.xAxis1).call(newAxis.x1)
            d3.select(this.$refs.yAxis1).call(newAxis.y1)
          })
        }
      },
      'brush': {
        handler: function (newBrush) {
          this.$nextTick(() => {
            d3.select(this.$refs.brush).call(newBrush)
          })
        }
      },
      'brushSelection': {
        handler: function (newSelection) {
          const tableWidth = this.$refs.selectionTable.getBoundingClientRect().width
          const selectionWidth = newSelection.x1 - newSelection.x0
          this.selectionTable.left = newSelection.x0 - (tableWidth / 2 - selectionWidth / 2)
          this.selectionTable.top = newSelection.y1
        }
      }
    }
  }
</script>

<style lang="sass" scoped>
    @import '~assets/base.sass'

    .fjs-control-panel
        .fjs-axis-params
            display: flex
            flex-direction: column
    svg
        .fjs-axis-label
            text-anchor: middle
    .fjs-selection-table
        border-collapse: collapse
        background: rgb(216, 217, 216)
        color: #000
        margin: 0
        #table-colnames
            border-top: 1px solid black
            border-bottom: 1px solid black
        td, tr
            border: none
        tr
            &:hover:not(#table-colnames)
                background: aqua
</style>

<!--CSS for dynamically created components-->
<style lang="sass">
    @import '~assets/d3.sass'

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