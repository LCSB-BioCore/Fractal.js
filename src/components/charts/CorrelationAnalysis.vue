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
           @click="runAnalysisWrapper"
           value="Run Analysis"
           :disabled="disabled"/>

    <div id="visualisation-section" style="height: 75%;">
      <svg width="100%" height="100%">
        <g :style="{transform: `translate(${margin.left}px, ${margin.top}px)`}">
          <circle :cx="scales.x(point.x)" :cy="scales.y(point.y)" r="4" v-for="point in points"></circle>
        </g>
      </svg>
    </div>

  </div>
</template>


<script>
  import DataBox from '../DataBox.vue'
  import requestHandling from '../mixins/request-handling'
  import * as d3 from 'd3'
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
            y: `$${this.xyData[1]}$`
          }
        },
        margin: {
          left: 50,
          top: 50,
          right: 50,
          bottom: 50
        },
        analysisResults: {},
        scales: {
          x: null,
          y: null
        },
        points: []
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
      }
    },
    watch: {
      analysisResults: function () {
        this.updateChart()
      }
    },
    mounted() {
      window.addEventListener('resize', this.onResize)
      this.onResize() // initial call
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
      runAnalysisWrapper () {
        // function made available via requestHandling mixin
        this.runAnalysis({job_name: 'compute-correlation', args: this.args})
          .then(response => {
            const results = JSON.parse(response)
            results.data = JSON.parse(results.data)
            this.analysisResults = results
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
      },
      updateChart () {
        this.points = Object.keys(this.analysisResults.data.id).map(key => {
          return {
            x: this.analysisResults.data[this.analysisResults.x_label][key],
            y: this.analysisResults.data[this.analysisResults.y_label][key],
            id: this.analysisResults.data.id[key]
          }
        })
        this.scales.x = d3.scaleLinear()
          .domain(d3.extent(this.points.map(d => d.x)))
          .range([0, this.padded.width])
        this.scales.y = d3.scaleLinear()
          .domain(d3.extent(this.points.map(d => d.y)))
          .range([this.padded.height, 0])
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
</style>