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
      <svg width="100%" height="100%">
        <g :style="{ transform: `translate(${margin.left}px, ${margin.top}px)` }">
          <circle :cx="scales.x(point.x)"
                  :cy="scales.y(point.y)"
                  r="4"
                  :data-idx="idx"
                  v-for="(point, idx) in shownPoints.all">
          </circle>
          <line id="lin-reg-line"
                :x1="tweenedRegLine.x1"
                :x2="tweenedRegLine.x2"
                :y1="tweenedRegLine.y1"
                :y2="tweenedRegLine.y2">
          </line>
          <g id="x-axis-1" class="fjs-corr-axis" :style="{ transform: `translate(0px, ${padded.height}px)` }"></g>
          <g id="x-axis-2" class="fjs-corr-axis"></g>
          <g id="y-axis-1" class="fjs-corr-axis"></g>
          <g id="y-axis-2" class="fjs-corr-axis" :style="{ transform: `translate(${padded.width}px, 0px)` }"></g>
          <g id="brush"></g>
          <rect :x="scales.x(bin.x0)"
                :y="padded.height"
                :width="scales.x(bin.x1) - scales.x(bin.x0)"
                :height="histogramScales.y(bin.length)"
                v-for="(bin, idx) in histograms.xBins">
          </rect>
          <rect :x="-histogramScales.x(bin.length)"
                :y="scales.y(bin.x1)"
                :width="histogramScales.x(bin.length)"
                :height="scales.y(bin.x0) - scales.y(bin.x1)"
                v-for="(bin, idx) in histograms.yBins">
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
          coef: 0,
          p_value: 0,
          slope: 0,
          intercept: 0,
          method: '',
          x_label: '',
          y_label: '',
          get data() {
            return {
              id: [],
              [this.x_label]: [],
              [this.y_label]: []
            }
          }
        },
        tmpAnalysisResults: {
          coef: 0,
          p_value: 0,
          slope: 0,
          intercept: 0,
          method: '',
          x_label: '',
          y_label: '',
          get data() {
            return {
              id: [],
              [this.x_label]: [],
              [this.y_label]: []
            }
          }
        },
        selectedPoints: [],
        tweenedRegLine: {}
      }
    },
    computed: {
      disabled () {
        return this.xyData.length !== 2
      },
      margin () {
        const left = this.width / 3
        const top = 0
        const right = 0
        const bottom = this.height / 3
        return { left, top, right, bottom }
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return { width, height }
      },
      shownPoints () {
        const xs = [], ys = [], ids = []
        const all = Object.keys(this.shownAnalysisResults.data.id).map(key => {
          const x = this.shownAnalysisResults.data[this.shownAnalysisResults.x_label][key]
          const y = this.shownAnalysisResults.data[this.shownAnalysisResults.y_label][key]
          const id = this.shownAnalysisResults.data.id[key]
          xs.push(x)
          ys.push(y)
          ids.push(id)
          return { x, y, id }
        })
        return { xs, ys, ids, all }
      },
      tmpPoints() {
        const xs = [], ys = [], ids = []
        const all = Object.keys(this.tmpAnalysisResults.data.id).map(key => {
          const x = this.tmpAnalysisResults.data[this.tmpAnalysisResults.x_label][key]
          const y = this.tmpAnalysisResults.data[this.tmpAnalysisResults.y_label][key]
          const id = this.tmpAnalysisResults.data.id[key]
          xs.push(x)
          ys.push(y)
          ids.push(id)
          return { x, y, id }
        })
        return { xs, ys, ids, all }
      },
      valid () {
        const tmpAnalysisResults = this.tmpPoints.all.length  // TODO
        return { tmpAnalysisResults }
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
        if (! this.valid.tmpAnalysisResults) {
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
        const xBins = d3.histogram()
          .domain(this.tmpScales.x.domain())
          .thresholds(this.tmpScales.x.ticks(10))(this.tmpPoints.xs)
        const yBins = d3.histogram()
          .domain(this.tmpScales.y.domain())
          .thresholds(this.tmpScales.y.ticks(10))(this.tmpPoints.ys)
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
    },
    watch: {
      'axis': {
        handler: function(newAxis) {
          d3.select('#x-axis-1').call(newAxis.x1)
          d3.select('#x-axis-2').call(newAxis.x2)
          d3.select('#y-axis-1').call(newAxis.y1)
          d3.select('#y-axis-2').call(newAxis.y2)
        },
        deep: true
      },
      'brush': {
        handler: function(newBrush) {
          d3.select('#brush').call(newBrush)
        },
        deep: true
      },
      'regLine': {
        handler: function(newRegLine, oldRegLine) {
          let coords = oldRegLine
          TweenLite.to(coords, 0.5, Object.assign(newRegLine, {onUpdate: () => { this.tweenedRegLine = coords }}))
        },
        deep: true
      }
    },
    mounted() {
      window.addEventListener('resize', this.onResize)
      this.onResize() // initial call
      this.tmpAnalysisResults = this.shownAnalysisResults
    },
    beforeDestroy() {
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
</style>

<!--CSS for dynamically created components-->
<style>
  .fjs-corr-axis .tick {
    shape-rendering: crispEdges;
  }
</style>