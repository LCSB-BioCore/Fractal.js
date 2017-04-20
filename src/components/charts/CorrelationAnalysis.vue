<template>
  <div style="height: 100%; width: 100%">

    <div id="data-box-section" style="height: 25%;">
      <data-box header="X and Y variables"
                dataType="numerical"
                v-on:update="update_xyData">
      </data-box>
      <data-box header="Annotations"
                dataType="categorical"
                v-on:update="update_annotationData">
      </data-box>
    </div>

    <input id="run-analysis-btn"
           type="button"
           @click="runAnalysisWrapper({init: true})"
           value="Run Analysis"
           :disabled="disabled"/>

    <div id="visualisation-section" style="height: 75%;">
      <table class="stats-table" v-show="! shownAnalysisResults.init">
        <tr>
          <td>Corr. Coef.</td>
          <td>{{ tmpAnalysisResults.coef }}</td>
        </tr>
        <tr>
          <td>p-value</td>
          <td>{{ tmpAnalysisResults.p_value }}</td>
        </tr>
      </table>
      <svg width="100%" height="100%" v-show="! shownAnalysisResults.init">
        <g :style="{ transform: `translate(${margin.left}px, ${margin.top}px)` }">
          <g id="x-axis-1" class="fjs-corr-axis" :style="{ transform: `translate(0px, ${padded.height}px)` }"></g>
          <g id="x-axis-2" class="fjs-corr-axis"></g>
          <g id="y-axis-1" class="fjs-corr-axis"></g>
          <g id="y-axis-2" class="fjs-corr-axis" :style="{ transform: `translate(${padded.width}px, 0px)` }"></g>
          <g id="brush"></g>
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
          <circle class="scatterplot-point"
                  :cx="scales.x(point.x)"
                  :cy="scales.y(point.y)"
                  r="4"
                  :data-idx="idx"
                  v-for="(point, idx) in shownPoints.all">
          </circle>
          <line id="lin-reg-line"
                :x1="tweened.regLine.x1"
                :x2="tweened.regLine.x2"
                :y1="tweened.regLine.y1"
                :y2="tweened.regLine.y2">
          </line>
          <rect class="histogram-rect"
                :x="attr.x"
                :y="attr.y"
                :width="attr.width"
                :height="attr.height"
                v-for="attr in tweened.histogramAttr.xAttr">
          </rect>
          <rect class="histogram-rect"
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
  import requestHandling from '../mixins/request-handling'
  import * as d3 from 'd3'
  import d3Tip from 'd3-tip'; d3.tip = d3Tip
  import { TweenLite } from 'gsap'
  export default {
    name: 'correlation-analysis',
    data () {
      return {
        width: 0,
        height: 0,
        xyData: [],
        annotationData: [],
        get args () {
          return {
            x: `$${this.xyData[0]}$`,
            y: `$${this.xyData[1]}$`,
            ids: this.selectedPoints.map(d => d.id)
          }
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
          },
        }
      }
    },
    computed: {
      disabled () {
        return this.xyData.length !== 2
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
      tip () {
        return d3.tip()
          .attr('class', 'd3-tip')
          .offset([-15, 0])
          .html(d => d)
      },
      shownPoints () {
        const xs = [], ys = [], ids = []
        let all = []
        if (! this.shownAnalysisResults.init) {
          all = Object.keys(this.shownAnalysisResults.data.id).map(key => {
            const x = this.shownAnalysisResults.data[this.shownAnalysisResults.x_label][key]
            const y = this.shownAnalysisResults.data[this.shownAnalysisResults.y_label][key]
            const id = this.shownAnalysisResults.data.id[key]
            xs.push(x)
            ys.push(y)
            ids.push(id)
            return {x, y, id}
          })
        }
        return { xs, ys, ids, all }
      },
      tmpPoints () {
        const xs = [], ys = [], ids = []
        let all = []
        if (! this.tmpAnalysisResults.init) {
          const all = Object.keys(this.tmpAnalysisResults.data.id).map(key => {
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
          .domain(d3.extent(this.shownPoints.xs))
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain(d3.extent(this.shownPoints.ys))
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

        x1 = x1 < 0 ? 0 : x1;
        x1 = x1 > this.width ? this.width : x1;

        x2 = x2 < 0 ? 0 : x2;
        x2 = x2 > this.width ? this.width : x2;

        y1 = y1 < 0 ? 0 : y1;
        y1 = y1 > this.height ? this.height : y1;

        y2 = y2 < 0 ? 0 : y2;
        y2 = y2 > this.height ? this.height : y2;

        return { x1, x2, y1, y2 }
      },
      brush () {
        return d3.brush()
          .extent([[0, 0], [this.padded.width, this.padded.height]])
          .on('end', () => {
            if (! d3.event.selection) {
              this.selectedPoints = []
              this.runAnalysisWrapper({init: false})
              return
            }
            const [[x0, y0], [x1, y1]] = d3.event.selection
            this.selectedPoints = this.shownPoints.all.filter(d => {
              const x = this.scales.x(d.x)
              const y = this.scales.y(d.y)
              return x0 <= x && x <= x1 && y0 <= y && y <= y1;
            })
            this.runAnalysisWrapper({init: false})
          })
      },
      histograms () {
        const BINS = 10
        let xBins = [], yBins = []
        if (! this.tmpAnalysisResults.init) {
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
        // no, I didn't mix up xBins and yBins.
        const x = d3.scaleLinear()
          .domain(d3.extent(this.histograms.yBins.map(d => d.length)))
          .range([0, this.margin.left])
        const y = d3.scaleLinear()
          .domain(d3.extent(this.histograms.xBins.map(d => d.length)))
          .range([0, this.margin.bottom])
        return { x, y }
      },
      histogramAttr () {
        const xAttr = this.histograms.xBins.map(d => {
          return {
            x: this.scales.x(d.x0),
            y: this.padded.height + 2,
            width: this.scales.x(d.x1) - this.scales.x(d.x0),
            height: this.histogramScales.y(d.length)
          }
        })
        const yAttr = this.histograms.yBins.map(d => {
          return {
            x: - this.histogramScales.x(d.length),
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
        handler: function(newAxis) {
          d3.select('#x-axis-1').call(newAxis.x1)
          d3.select('#x-axis-2').call(newAxis.x2)
          d3.select('#y-axis-1').call(newAxis.y1)
          d3.select('#y-axis-2').call(newAxis.y2)
        }
      },
      'brush': {
        handler: function(newBrush) {
          d3.select('#brush').call(newBrush)
        }
      },
      'shownPoints': {
        handler: function(newShownPoints) {
          const vm = this
          vm.$nextTick(() => {  // wait until `circle` is actually rendered based on new shownPoints
            d3.selectAll('circle').on('mouseover', function() {
              const circle = d3.select(this)
              const idx = parseInt(circle.attr('data-idx'))
              const point = newShownPoints.all[idx]
              const html = `
<span>${vm.shownAnalysisResults.x_label}: ${point.x}</span><br/>
<span>${vm.shownAnalysisResults.y_label}: ${point.y}</span>
`
              vm.tip.show(html)
            })
            d3.selectAll('circle').on('mouseout', vm.tip.hide)
          })
        }
      },
      'regLine': {
        handler: function(newRegLine, oldRegLine) {
          const vm = this
          const coords = oldRegLine
          const targetCoords = newRegLine
          targetCoords.onUpdate = () => { this.tweened.regLine = coords }
          targetCoords.onComplete = () => {
            d3.select('#lin-reg-line').on('mouseover', function() {
              const html = `
<span>Slope: ${vm.tmpAnalysisResults.slope}</span><br/>
<span>Intercept: ${vm.tmpAnalysisResults.intercept}</span>
`
              vm.tip.show(html)
            })
            d3.select('#lin-reg-line').on('mouseout', vm.tip.hide)
          }
          TweenLite.to(coords, 0.5, targetCoords)
        }
      },
      'histogramAttr': {
        handler: function(newHistogramAttr, oldHistogramAttr) {
          // this is a bit like fibonacci. We need a previous value to start with initially
          if (! oldHistogramAttr.xAttr.length || ! oldHistogramAttr.yAttr.length) {
            this.tweened.histogramAttr = newHistogramAttr
            return
          }
          oldHistogramAttr.xAttr.forEach((d, i) => {
            const attr = oldHistogramAttr.xAttr[i]
            const targetAttr = newHistogramAttr.xAttr[i]
            targetAttr.onUpdate = () => { this.tweened.histogramAttr.xAttr[i] = attr }
            TweenLite.to(attr, 0.5, targetAttr)
          })
          oldHistogramAttr.yAttr.forEach((d, i) => {
            const attr = oldHistogramAttr.yAttr[i]
            const targetAttr = newHistogramAttr.yAttr[i]
            targetAttr.onUpdate = () => { this.tweened.histogramAttr.yAttr[i] = attr }
            TweenLite.to(attr, 0.5, targetAttr)
          })
        }
      }
    },
    mounted () {
      window.addEventListener('resize', this.onResize)
      this.onResize() // initial call
      this.tmpAnalysisResults = this.shownAnalysisResults
      d3.select('svg').call(this.tip)
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.onResize)
    },
    components: {
      DataBox
    },
    mixins: [
      requestHandling
    ],
    methods: {
      runAnalysisWrapper ({init}) {
        // function made available via requestHandling mixin
        this.runAnalysis({job_name: 'compute-correlation', args: this.args})
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
        const section = this.$el.querySelector('#visualisation-section')
        this.height = section.clientHeight
        this.width = section.clientWidth
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


<style scoped>
  *, text {
    font-family: 'Roboto', sans-serif;
  }

  #data-box-section {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
  }

  #run-analysis-btn {
    width: 100%;
    height: 20px;
  }

  #lin-reg-line {
    stroke: #ff5e00;
    stroke-width: 4px;
  }

  #lin-reg-line :hover {

  }

  .histogram-rect {
    stroke: #fff;
    shape-rendering: crispEdges;
    stroke-width: 0px;
    fill: #ffd100;
  }

  .stats-table {
    margin: 5px;
    border-spacing: 0;
    border-collapse: collapse;
  }

  .stats-table, .stats-table td, .stats-table th {
    border: 1px black solid;
    border-collapse: collapse;
    padding: 5px;
  }

  .scatterplot-point :hover {
    fill: #f00;
  }
</style>

<!--CSS for dynamically created components-->

<style src="../../assets/tooltip.css"></style>
<style src="../../assets/base.css"></style>
<style>
  .fjs-corr-axis .tick {
    shape-rendering: crispEdges;
  }
</style>