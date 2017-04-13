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
                  v-for="(point, idx) in points.shown">
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
        margin: {
          left: 50,
          top: 50,
          right: 50,
          bottom: 50
        },

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
        tmpAnalysisResults: {},
        selectedPoints: [],
        tweenedRegLine: {}
      }
    },
    computed: {
      disabled () {
        return this.xyData.length !== 2
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return { width, height }
      },
      points () {
        const shown = Object.keys(this.shownAnalysisResults.data.id).map(key => {
          return {
            x: this.shownAnalysisResults.data[this.shownAnalysisResults.x_label][key],
            y: this.shownAnalysisResults.data[this.shownAnalysisResults.y_label][key],
            id: this.shownAnalysisResults.data.id[key]
          }
        })
        const temp = Object.keys(this.shownAnalysisResults.data.id).map(key => {
          return {
            x: this.shownAnalysisResults.data[this.shownAnalysisResults.x_label][key],
            y: this.shownAnalysisResults.data[this.shownAnalysisResults.y_label][key],
            id: this.shownAnalysisResults.data.id[key]
          }
        })
        return { shown, temp }
      },
      valid () {
        const tmpAnalysisResults = Object.keys(this.tmpAnalysisResults).length && this.points.temp.length
        return { tmpAnalysisResults }
      },
      scales () {
        const x = d3.scaleLinear()
          .domain(d3.extent(this.points.shown.map(d => d.x)))
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain(d3.extent(this.points.shown.map(d => d.y)))
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
        if (! this.valid.tmpAnalysisResults) {
          return { x1: 0, x2: 0, y1: 0, y2: 0 }
        }
        const xarr = this.points.temp.map(d => d.x)
        const minX = Math.min.apply(null, xarr)
        const maxX = Math.max.apply(null, xarr)
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
            this.selectedPoints = this.points.shown.filter(d => {
              const x = this.scales.x(d.x)
              const y = this.scales.y(d.y)
              return x0 <= x && x <= x1 && y0 <= y && y <= y1;
            })
            this.runAnalysisWrapper({init: false})
          })
      }
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