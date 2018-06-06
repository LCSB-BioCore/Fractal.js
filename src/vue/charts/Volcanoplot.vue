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
                <div>
                    <label>
                        <input type="radio" value="limma" v-model="rankingMethod">
                        Limma
                    </label>
                </div>
                <div>
                    <label>
                        <input type="radio" value="DESeq2" v-model="rankingMethod">
                        DESeq2
                    </label>
                </div>
            </fieldset>
        </control-panel>
        <svg :height="height" :width="width">
            <g :transform="`translate(${margin.left}, ${margin.top})`">
                <crosshair :width="padded.width" :height="padded.height"/>
                <image :xlink:href="dataUrl" :width="padded.width" :height="padded.height"></image>
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
  export default {
    name: 'volcanoplot',
    components: {Crosshair, DataBox, ControlPanel, Chart},
    mixins: [RunAnalysis],
    data () {
      return {
        height: 0,
        width: 0,
        arrays: [],
        rankingMethod: 'limma',
        results: {
          pValue: [],
          logFC: [],
          baseMean: []
        },
        dataUrl: ''
      }
    },
    computed: {
      args () {
        return {
          numerical_arrays: this.arrays,
          id_filter: [],
          ranking_method: this.rankingMethod,
          subsets: store.getters.subsets
        }
      },
      validArgs () {
        return this.args.numerical_arrays.length > 0
      },
      margin () {
        const left = this.width / 20
        const top = this.height / 20
        const right = this.width / 20
        const bottom = this.height / 20
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
      rawPoints () {
        // TODO: make configurable
        const x = this.results.pValue
        const y = this.results.logFC
        return { x, y }
      },
      scales () {
        const x = d3.scaleLinear()
          .domain(d3.extent(this.rawPoints.x))
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain(d3.extent(this.rawPoints.y))
          .range([this.padded.height, 0])
        return { x, y }
      },
      scaledPoints () {
        return this.rawPoints.x.map(_, i => {
          const x = this.scales.x(this.rawPoints.x[i])
          const y = this.scales.y(this.rawPoints.y[i])
          return { x, y }
        })
      },
      axis () {
        return {}
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
          })
          .catch(error => console.error(error))
      },
      drawPoints (points) {
        const ctx = this.canvas.getContext('2d')
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        points.forEach(d => {
          ctx.beginPath()
          ctx.fillStyle = '#000'
          ctx.fillRect(d.x - this.pointSize / 2, d.y - this.pointSize / 2, this.pointSize, this.pointSize)
        })
        this.dataUrl = this.canvas.toDataURL('image/png')
      }
    },
    watch: {
      'args': {
        handler: function (newArgs, oldArgs) {
          if (this.validArgs) {
            this.runAnalysisWrapper(newArgs)
          }
        }
      },
      'scaledPoints': {
        handler: function (newPoints) {
          this.$nextTick(() => {
            this.drawPoints(newPoints)
          })
        }
      }
    }
  }
</script>

<style lang="sass" scoped>
    @import '~assets/base.sass'
</style>