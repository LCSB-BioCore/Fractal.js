<template>
    <chart v-on:resize="resize">
        <control-panel name="Volcanoplot Panel">
            <data-box :header="params.numVars.label"
                      :data-types="['numerical_array']"
                      :validRange="[params.numVars.minLength, params.numVars.maxLength]"
                      v-model="params.numVars.value"
                      v-on:update="updateNumVars">
            </data-box>
            <hr class="fjs-seperator"/>
            <div class="fjs-settings">
                <fieldset class="fjs-fieldset">
                    <legend>{{ params.rankingMethod.label }}</legend>
                    <div v-for="method in params.rankingMethod.validValues">
                        <label>
                            <input type="radio" :value="method" v-model="params.rankingMethod.value">
                            {{ method }}
                        </label>
                    </div>
                </fieldset>
                <div class="fjs-axis-params">
                    <label>
                        X-Axis
                        <select v-model="params.xAxisTransform.value">
                            <option :value="d" v-for="d in params.xAxisTransform.validValues">{{ d }}</option>
                        </select>
                        <select v-model="params.xAxisStatistic.value">
                            <option :value="d" v-for="d in params.xAxisStatistic.validValues">{{ d }}</option>
                        </select>
                    </label>
                    <label>
                        Y-Axis
                        <select v-model="params.yAxisTransform.value">
                            <option :value="d" v-for="d in params.yAxisTransform.validValues">{{ d }}</option>
                        </select>
                        <select v-model="params.yAxisStatistic.value">
                            <option :value="d" v-for="d in params.yAxisStatistic.validValues">{{ d }}</option>
                        </select>
                    </label>
                </div>
                <div v-if="params.rankingMethod.value === 'DESeq2'">
                    <label>
                        {{ params.minTotalRowCount.label }}:
                        <input type="number" v-model.lazy.number="params.minTotalRowCount.value"/>
                    </label>
                </div>
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
                            <td>{{ params.xAxisStatistic.value }}</td>
                            <td>{{ params.yAxisStatistic.value }}</td>
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
                <g class="fjs-axis" ref="xAxis1" :transform="`translate(0, ${padded.height})`"></g>
                <g class="fjs-axis" ref="yAxis1"></g>
                <g class="fjs-axis" ref="yAxis2" :transform="`translate(${padded.width}, 0)`"></g>
                <g class="fjs-axis" ref="xAxis2"></g>
                <text class="fjs-axis-label"
                      :transform="`translate(${padded.width / 2}, ${padded.height})`">
                    {{ `${params.xAxisTransform.value}(${params.xAxisStatistic.value})` }}
                </text>
                <text class="fjs-axis-label"
                      style="dominant-baseline: hanging"
                      :transform="`translate(${0}, ${padded.height / 2})rotate(-90)`">
                    {{ `${params.yAxisTransform.value}(${params.yAxisStatistic.value})` }}
                </text>
                <text class="fjs-axis-label"
                      style="dominant-baseline: hanging"
                      :transform="`translate(${padded.width / 2}, ${0})`">
                    {{ `${params.xAxisStatistic.value}` }}
                </text>
                <text class="fjs-axis-label"
                      style="dominant-baseline: hanging"
                      :transform="`translate(${padded.width}, ${padded.height / 2})rotate(90)`">
                    {{ `${params.yAxisStatistic.value}` }}
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
  import ParameterInterface from '../mixins/parameter-interface'
  export default {
    name: 'volcanoplot',
    components: {Draggable, Html2svg, Crosshair, DataBox, ControlPanel, Chart},
    mixins: [RunAnalysis, ParameterInterface],
    data () {
      return {
        height: 0,
        width: 0,
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
            label: 'Differential Expression Analysis',
            type: String,
            validValues: ['limma', 'DESeq2'],
            value: 'limma'
          },
          minTotalRowCount: {
            label: 'Minimal total reads',
            type: Number,
            min: 0,
            max: Infinity,
            value: 10
          },
          xAxisTransform: {
            label: 'X-Axis Transform',
            type: String,
            validValues: ['log2', '-log2', 'log10', '-log10', 'identity'],
            value: 'identity'
          },
          yAxisTransform: {
            label: 'Y-Axis Transform',
            ype: String,
            validValues: ['log2', '-log2', 'log10', '-log10', 'identity'],
            value: '-log10'
          },
          xAxisStatistic: {
            label: 'X-Axis Statistic',
            type: String,
            validValues: [],
            value: ''
          },
          yAxisStatistic: {
            label: 'Y-Axis Statistic',
            type: String,
            validValues: [],
            value: ''
          }
        },
        transformations: {
          'log2': Math.log2,
          '-log2': d => -Math.log2(d),
          'log10': Math.log10,
          '-log10': d => -Math.log10(d),
          'identity': d => d
        },
        inverseTransformations: {
          'log2': d => Math.pow(2, d),
          '-log2': d => Math.pow(2, -d),
          'log10': d => Math.pow(10, d),
          '-log10': d => Math.pow(10, -d),
          'identity': d => d
        },
        brushSelection: {},
        selectionTable: {
          left: 0,
          top: 0
        },
        highlightedFeature: '',
        results: {
          stats: { feature: [] }
        },
        dataUrl: '',
        selectedFeatures: []
      }
    },
    mounted () {
      this.registerParameterObjectInterface('params')
    },
    computed: {
      args () {
        return {
          numerical_arrays: this.params.numVars.value,
          id_filter: store.getters.filter('ids').value,
          params: { min_total_row_count: this.params.minTotalRowCount.value }, // FIXME: Refactor me (back-end too)
          ranking_method: this.params.rankingMethod.value,
          subsets: store.getters.subsets
        }
      },
      validArgs () {
        return this.args.numerical_arrays.length > 0
      },
      margin () {
        const left = this.width / 15
        const top = this.height / 15
        const right = this.width / 15
        const bottom = this.height / 15
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
          const x = this.transformations[this.params.xAxisTransform.value](this.results.stats[this.params.xAxisStatistic.value][i])
          const y = this.transformations[this.params.yAxisTransform.value](this.results.stats[this.params.yAxisStatistic.value][i])
          if (isFinite(x) && isFinite(y)) {
            xs.push(x)
            ys.push(y)
            features.push(feature)
          }
        })
        return { xs, ys, features }
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
        const x2 = d3.axisTop(this.scales.x)
          .tickFormat(d => this.inverseTransformations[this.params.xAxisTransform.value](d).toPrecision(2))
          .tickSize(-this.padded.height)
        const y2 = d3.axisRight(this.scales.y)
          .tickFormat(d => this.inverseTransformations[this.params.yAxisTransform.value](d).toPrecision(2))
          .tickSize(-this.padded.width)
        return {x1, x2, y1, y2}
      },
      statistics () {
        if ((this.params.rankingMethod.value === 'limma') && (store.getters.subsets.length === 2)) {
          return ['logFC', 'P.Value', 'AveExpr', 't', 'adj.P.Val', 'B']
        } else if ((this.params.rankingMethod.value === 'limma') && (store.getters.subsets.length > 2)) {
          return ['F', 'P.Value', 'AveExpr', 'adj.P.Val']
        } else if (this.params.rankingMethod.value === 'DESeq2') {
          return ['log2FoldChange', 'pvalue', 'baseMean', 'lfcSE', 'stat', 'padj']
        } else {
          throw new Error(`Unknown ranking method: ${this.params.rankingMethod.value}`)
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
          const xStat = this.results.stats[this.params.xAxisStatistic.value][i].toPrecision(2)
          const yStat = this.results.stats[this.params.yAxisStatistic.value][i].toPrecision(2)
          return { feature, xStat, yStat }
        })
      }
    },
    methods: {
      resize (width, height) {
        this.width = width
        this.height = height
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
            ctx.fillStyle = 'rgba(255, 0, 0, 1)'
            pointSize *= 2
          } else {
            ctx.fillStyle = `rgba(0, 0, 0, ${1 - d.y / this.padded.height})`
          }
          ctx.fillRect(d.x - pointSize / 2, d.y - pointSize / 2, pointSize, pointSize)
        })
        this.dataUrl = this.canvas.toDataURL('image/png')
      },
      updateNumVars (ids) {
        this.params.numVars.validValues = ids
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
            this.params.xAxisStatistic.value = newStats[0]
            this.params.yAxisStatistic.value = newStats[1]
            this.params.xAxisStatistic.validValues = newStats
            this.params.yAxisStatistic.validValues = newStats
          }
        },
        immediate: true
      },
      'axis': {
        handler: function (newAxis) {
          this.$nextTick(() => {
            d3.select(this.$refs.xAxis1).call(newAxis.x1)
            d3.select(this.$refs.yAxis1).call(newAxis.y1)
              .selectAll('text')
              .attr('transform', 'rotate(-60)')
              .attr('text-anchor', 'end')
            d3.select(this.$refs.yAxis2).call(newAxis.y2)
              .selectAll('text')
              .attr('transform', 'rotate(60)')
              .attr('text-anchor', 'start')
            d3.select(this.$refs.xAxis2).call(newAxis.x2)
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
          let left = newSelection.x0 - (tableWidth / 2 - selectionWidth / 2)
          const top = newSelection.y1
          left = left < 0 ? 0 : left
          left = left + tableWidth > this.padded.width ? this.padded.width - tableWidth : left
          this.selectionTable.left = left
          this.selectionTable.top = top
        }
      }
    }
  }
</script>

<style lang="sass" scoped>
    @import '~assets/base.sass'

    .fjs-control-panel
        .fjs-settings
            > *
                margin-bottom: 1vh
            .fjs-axis-params
                display: flex
                flex-direction: column
    svg
        .fjs-axis-label
            text-anchor: middle
    .fjs-selection-table
        background: #97d8ff
        color: #000
        margin: 0
        text-align: center
        #table-colnames
            border-top: 1px solid black
            border-bottom: 1px solid black
        td, tr
            border: none
        tr
            margin: 0
            &:hover:not(#table-colnames)
                background: #ff6c6c
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
