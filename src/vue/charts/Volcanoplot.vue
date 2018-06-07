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
  import _ from 'lodash'
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
        results: {
          features: [],
          stats: {'': []}
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
      points () {
        const x = this.results.stats[this.xAxisStatistic]
          .map(d => this.transformations[this.xAxisTransform](d))
          .filter(d => isFinite(d))
        const y = this.results.stats[this.yAxisStatistic]
          .map(d => this.transformations[this.yAxisTransform](d))
          .filter(d => isFinite(d))
        return { x, y }
      },
      scales () {
        const x = d3.scaleLinear()
          .domain(d3.extent(this.points.x))
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain(d3.extent(this.points.y))
          .range([this.padded.height, 0])
        return { x, y }
      },
      scaledPoints () {
        return this.points.x.map((_, i) => {
          const x = this.scales.x(this.points.x[i])
          const y = this.scales.y(this.points.y[i])
          return { x, y }
        })
      },
      axis () {
        return {}
      },
      statistics () {
        if ((this.rankingMethod === 'limma') && (store.getters.subsets.length === 2)) {
          return ['logFC', 'P.Value', 'feature', 'AveExpr', 't', 'adj.P.Val', 'B']
        } else if ((this.rankingMethod === 'limma') && (store.getters.subsets.length > 2)) {
          return ['F', 'P.Value', 'feature', 'AveExpr', 'adj.P.Val']
        } else if (this.rankingMethod === 'DESeq2') {
          return ['log2FoldChange', 'pvalue', 'baseMean', 'lfcSE', 'stat', 'padj']
        } else {
          throw new Error(`Unknown ranking method: ${this.rankingMethod}`)
        }
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
          this.drawPoints(newPoints)
        }
      },
      'statistics': {
        handler: function (newStats, oldStats) {
          if (!_.isEqual(newStats, oldStats)) {
            this.xAxisStatistic = newStats[0]
            this.yAxisStatistic = newStats[1]
            this.results.stats = _.zipObject(newStats, _.times(newStats.length, _ => []))
          }
        },
        immediate: true
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
</style>