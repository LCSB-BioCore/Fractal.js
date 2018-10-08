<template>
  <chart v-on:resize="resize">

    <control-panel name="PCA Panel">
      <data-box :header="params.numVars.label"
                :dataTypes="['numerical', 'numerical_array']"
                :validRange="[params.numVars.minLength, params.numVars.maxLength]"
                v-model="params.numVars.value"
                v-on:update="updateNumVars">
      </data-box>
      <data-box :header="params.catVars.label"
                :dataTypes="['categorical']"
                :validRange="[params.catVars.minLength, params.catVars.maxLength]"
                v-model="params.catVars.value"
                v-on:update="updateCatVars">
      </data-box>
      <hr class="fjs-seperator"/>
      <div>
        <label>
          <select v-model="pcX">
            <option :value="i" v-for="i in pcomponents">Principal Component {{i + 1}}</option>
          </select>
          X-Axis
        </label>
        <br/>
        <label>
          <select v-model="pcY">
            <option :value="i" v-for="i in pcomponents">Principal Component {{i + 1}}</option>
          </select>
          Y-Axis
        </label>
      </div>
      <div>
        <label>
          <input type="checkbox" v-model="params.whiten.value"/>
          {{ params.whiten.label }}
        </label>
      </div>
      <div>
        <label>
          <input type="checkbox" v-model="params.ignoreSubsets.value"/>
          {{ params.ignoreSubsets.label }}
        </label>
      </div>
    </control-panel>

    <svg :width="width" :height="height">
      <g :transform="`translate(${margin.left}, ${margin.top})`">
        <html2svg :right="padded.width">
          <draggable>
            <div class="fjs-legend">
              <div v-for="(point, i) in legendSubsetPoints">
                <svg :width="pointSize * 2" :height="pointSize * 2">
                  <polygon :points="point"></polygon>
                </svg>
                <span>S{{ i + 1 }}</span>
              </div>
              <div class="fjs-legend-category" v-for="(color, i) in legendCategoryColors">
                <div :style="{background: color}"></div>
                <span>&nbsp{{ categories[i] }}</span>
              </div>
            </div>
          </draggable>
        </html2svg>
        <g class="fjs-axis" ref="yAxis2" :transform="`translate(${padded.width}, 0)`"></g>
        <g class="fjs-axis" ref="xAxis2"></g>
        <g class="fjs-axis" ref="xAxis1" :transform="`translate(0, ${padded.height})`"></g>
        <g class="fjs-axis" ref="yAxis1"></g>
        <crosshair :width="padded.width" :height="padded.height"/>
        <image :xlink:href="dataUrls.main" :width="padded.width" :height="padded.height"></image>
        <g class="fjs-brush" ref="brush"></g>
        <text :x="padded.width / 2"
              :y="- margin.top / 2"
              text-anchor="middle"
              v-show="results.data.id.length">
          Principal Component {{pcX + 1}} (Variance Ratio: {{ results.variance_ratios[pcX].toFixed(2) }})
        </text>
        <text text-anchor="middle"
              :transform="`translate(${this.padded.width + this.margin.right / 2}, ${this.padded.height / 2})rotate(90)`"
              v-show="results.data.id.length">
          Principal Component {{pcY + 1}} (Variance Ratio: {{ results.variance_ratios[pcY].toFixed(2) }})
        </text>
        <g v-for="loading in loadings">
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
          <g class="fjs-pc-distribution fjs-pc-x-distribution"
             :transform="`translate(0, ${padded.height + margin.bottom / 2})`">
            <line :x2="padded.width"></line>
            <image :xlink:href="dataUrls.xDist"
                   :y="-pointSize / 2"
                   :width="padded.width"
                   :height="pointSize">
            </image>
          </g>
          <g class="fjs-pc-distribution fjs-pc-y-distribution"
             :transform="`translate(${- margin.left / 2}, 0)`">
            <line :y2="padded.height"></line>
            <image :xlink:href="dataUrls.yDist"
                   :x="-pointSize / 2"
                   :width="pointSize"
                   :height="padded.height">
            </image>
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
  import { getPolygonPointsForSubset } from '../../utils/utils'
  import store from '../../store/store'
  import RunAnalysis from '../mixins/run-analysis'
  import * as d3 from 'd3'
  import tooltip from '../directives/tooltip.js'
  import deepFreeze from 'deep-freeze-strict'
  import Crosshair from '../components/Crosshair.vue'
  import Html2svg from '../components/HTML2SVG.vue'
  import Draggable from '../components/Draggable.vue'
  import getHDPICanvas from '../../utils/high-dpi-canvas'
  import ParameterInterface from '../mixins/parameter-interface'
  export default {
    name: 'pca',
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
            minLength: 2,
            maxLength: Infinity,
            value: []
          },
          catVars: {
            label: 'Categorical Variables',
            type: Array,
            elementType: String,
            validValues: [],
            minLength: 0,
            maxLength: Infinity,
            value: []
          },
          whiten: {
            label: 'Whiten Output',
            type: Boolean,
            value: false
          },
          ignoreSubsets: {
            label: 'Ignore Subsets',
            type: Boolean,
            value: false
          }
        },
        results: {
          data: {
            0: [],
            1: [],
            id: [],
            subset: [],
            category: []
          },
          loadings: {
            0: [],
            1: [],
            feature: []
          },
          variance_ratios: [0, 0]
        },
        pcX: 0,
        pcY: 1,
        categoryColors: d3.schemeCategory10,
        subsetColors: d3.schemeCategory10.slice().reverse(),
        selectedPoints: [],
        hasSetFilter: false,
        dataUrls: {
          main: '',
          xDist: '',
          yDist: ''
        }
      }
    },
    mounted () {
      this.registerParameterObjectInterface('params')
    },
    computed: {
      idFilter () {
        return store.getters.filter('ids')
      },
      args () {
        return {
          features: this.params.numVars.value,
          categories: this.params.catVars.value,
          whiten: this.params.whiten.value,
          id_filter: this.idFilter.value,
          subsets: this.params.ignoreSubsets.value ? [] : store.getters.subsets
        }
      },
      validArgs () {
        return this.params.numVars.value.length > 1
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
      pointSize () {
        return this.padded.width / 125
      },
      canvas () {
        return {
          main: getHDPICanvas(this.padded.width, this.padded.height),
          xDist: getHDPICanvas(this.padded.width, this.pointSize),
          yDist: getHDPICanvas(this.pointSize, this.padded.height)
        }
      },
      scales () {
        const x = d3.scaleLinear()
          .domain((() => {
            const xExtent = d3.extent(this.results.data[this.pcX])
            const xPadding = (xExtent[1] - xExtent[0]) / 10
            return [xExtent[0] - xPadding, xExtent[1] + xPadding]
          })())
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain((() => {
            const yExtent = d3.extent(this.results.data[this.pcY])
            const yPadding = (yExtent[1] - yExtent[0]) / 10
            return [yExtent[0] - yPadding, yExtent[1] + yPadding]
          })())
          .range([this.padded.height, 0])
        return { x, y }
      },
      loadingScales () {
        const x = d3.scaleLinear()
          .domain(d3.extent(this.scales.x.domain().concat(this.results.loadings[this.pcX])))
          .range(this.scales.x.range())
        const y = d3.scaleLinear()
          .domain(d3.extent(this.scales.y.domain().concat(this.results.loadings[this.pcY])))
          .range(this.scales.y.range())
        return { x, y }
      },
      points () {
        return this.results.data.id.map((d, i) => {
          return {
            x: this.scales.x(this.results.data[this.pcX][i]),
            y: this.scales.y(this.results.data[this.pcY][i]),
            id: d,
            category: this.results.data.category[i],
            subset: this.results.data.subset[i],
            shape: getPolygonPointsForSubset(
              {
                cx: this.scales.x(this.results.data[this.pcX][i]),
                cy: this.scales.y(this.results.data[this.pcY][i]),
                size: this.pointSize,
                subset: this.results.data.subset[i]
              }
            ),
            tooltip: `
<div>
  <p>ID: ${d}</p>
  <p>Subset: ${this.results.data.subset[i]}</p>
  ${this.results.data.category[i] !== '' ? '<p>Category: ' + this.results.data.category[i] + '</p>' : ''}
</div>
`
          }
        })
      },
      loadings () {
        return this.results.loadings.feature.map((d, i) => {
          return {
            x1: this.loadingScales.x(0),
            y1: this.loadingScales.y(0),
            x2: this.loadingScales.x(this.results.loadings[this.pcX][i]),
            y2: this.loadingScales.y(this.results.loadings[this.pcY][i]),
            feature: d
          }
        })
      },
      pcomponents () {
        return Object.keys(this.results.loadings).filter(d => d !== 'feature').map(d => parseInt(d))
      },
      subsets () {
        return [...new Set(this.results.data.subset)]
      },
      categories () {
        return [...new Set(this.results.data.category)]
      },
      legendSubsetPoints () {
        return this.subsets.map(subset => {
          return getPolygonPointsForSubset({
            cx: this.pointSize,
            cy: this.pointSize,
            size: this.pointSize,
            subset: subset
          })
        })
      },
      legendCategoryColors () {
        return this.categories.map(category => {
          return this.categoryColors[this.categories.indexOf(category) % this.categoryColors.length]
        })
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
            if (!d3.event.sourceEvent) {
              return
            }
            if (!d3.event.selection) {
              this.selectedPoints = []
            } else {
              const [[x0, y0], [x1, y1]] = d3.event.selection
              this.selectedPoints = this.points.filter(d => {
                return x0 <= d.x && d.x <= x1 && y0 <= d.y && d.y <= y1
              })
              this.hasSetFilter = true
            }
            store.dispatch('setFilter', {source: this._uid, filter: 'ids', value: this.selectedPoints.map(d => d.id)})
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
      'idFilter': {
        handler: function (newIdFilter) {
          if (newIdFilter.source !== this._uid) {
            this.brush.move(d3.select(this.$refs.brush), null)
          }
        }
      },
      'points': {
        handler: function (newPoints) {
          this.$nextTick(() => this.drawScatterPoints(newPoints))
          this.$nextTick(() => this.drawDistPoints(newPoints))
        }
      }
    },
    methods: {
      runAnalysisWrapper (args) {
        this.runAnalysis('compute-pca', args)
          .then(response => {
            const results = JSON.parse(response)
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            this.results = results
          })
          .catch(error => console.error(error))
      },
      drawScatterPoints (points) {
        const canvas = this.canvas.main
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        points.forEach(d => {
          ctx.beginPath()
          ctx.fillStyle = this.categoryColors[this.categories.indexOf(d.category) % this.categoryColors.length]
          ctx.moveTo(d.shape[0], d.shape[1])
          for (let i = 2; i < d.shape.length - 1; i += 2) {
            ctx.lineTo(d.shape[i], d.shape[i + 1])
          }
          ctx.closePath()
          ctx.fill()
        })
        this.dataUrls.main = canvas.toDataURL()
      },
      drawDistPoints (points) {
        const xCanvas = this.canvas.xDist
        const yCanvas = this.canvas.yDist
        const xctx = xCanvas.getContext('2d')
        const yctx = yCanvas.getContext('2d')
        xctx.clearRect(0, 0, xCanvas.width, xCanvas.height)
        yctx.clearRect(0, 0, yCanvas.width, yCanvas.height)
        xctx.globalAlpha = 0.05
        yctx.globalAlpha = 0.05
        points.forEach(point => {
          xctx.beginPath()
          yctx.beginPath()
          xctx.fillRect(point.x - this.pointSize / 2, 0, this.pointSize, this.pointSize)
          yctx.fillRect(0, point.y - this.pointSize / 2, this.pointSize, this.pointSize)
        })
        this.dataUrls.xDist = xCanvas.toDataURL()
        this.dataUrls.yDist = yCanvas.toDataURL()
      },
      resize (width, height) {
        this.width = width
        this.height = height
      },
      updateNumVars (ids) {
        this.params.numVars.validValues = ids
      },
      updateCatVars (ids) {
        this.params.catVars.validValues = ids
      }
    },
    components: {
      ControlPanel,
      DataBox,
      Chart,
      Crosshair,
      Html2svg,
      Draggable
    },
    directives: {
      tooltip
    },
    mixins: [
      RunAnalysis,
      ParameterInterface
    ]
  }
</script>

<style lang="sass" scoped>
  @import '~assets/base.sass'

  svg
    .fjs-loadings
      stroke: #f00
      stroke-width: 2px
    .fjs-loading-label
      fill: #7aff00
      font-weight: bold
    .fjs-pc-distribution
      line
        stroke: #000
        stroke-width: 1px
        shape-rendering: crispEdges
  .fjs-control-panel
    select
      margin: 0 0 0.5vh 0
      color: initial
  .fjs-legend
    display: flex
    flex-direction: column
    resize: both
    overflow: auto
    transform: translateZ(0)
    polygon
      fill: #7b7b7b
    .fjs-legend-category
      display: flex
      div
        flex: 1
      span
        flex: 8
        overflow: hidden
        white-space: nowrap
        text-overflow: ellipsis
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
