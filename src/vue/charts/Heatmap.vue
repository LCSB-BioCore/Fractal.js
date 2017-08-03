<template>
  <div :class="`fjs-heatmap fjs-vm-uid-${this._uid}`">
    <control-panel>
      <data-box class="fjs-data-box"
                header="Numerical Array Data"
                dataType="numerical_array"
                v-on:update="update_numericArrayData">
      </data-box>
    </control-panel>

    <div class="fjs-vis-container">
      <svg height="100%" width="100%">
        <g :transform="`translate(${margin.left}, ${margin.top})`">
          <text class="fjs-id-label"
                :transform="label.transform"
                :font-size="label.fontSize"
                v-for="label in labels.ids">
            {{ label.text }}
          </text>
          <text class="fjs-variable-label"
                :transform="label.transform"
                :font-size="label.fontSize"
                v-for="label in labels.variables">
            {{ label.text }}
          </text>
          <rect class="fjs-sig-bar"
                :x="bar.x"
                :y="bar.y"
                :height="bar.height"
                :width="bar.width"
                :fill="bar.fill"
                :title="bar.tooltip"
                v-tooltip
                v-for="bar in sigBars">
          </rect>
          <rect class="fjs-cell"
                :x="cell.x"
                :y="cell.y"
                :height="cell.height"
                :width="cell.width"
                :fill="cell.fill"
                :title="cell.tooltip"
                v-tooltip
                v-for="cell in cells">
          </rect>
        </g>
      </svg>
    </div>
    <task-view></task-view>
  </div>
</template>

<script>
  import DataBox from '../components/DataBox.vue'
  import store from '../../store/store'
  import runAnalysis from '../mixins/run-analysis'
  import * as d3 from 'd3'
  import tooltip from '../directives/tooltip.js'
  import TaskView from '../components/TaskView.vue'
  import deepFreeze from 'deep-freeze-strict'
  import { truncateTextUntil } from '../mixins/utils'
  import ControlPanel from '../components/ControlPanel.vue'
  export default {
    name: 'heatmap',
    data () {
      return {
        width: 500,
        height: 500,
        colorScale: d3.interpolateCool,
        numericArrayDataIds: [],
        selectedSigMes: 'logFC',
        results: {
          data: [],
          stats: []
        }
      }
    },
    computed: {
      args () {
        return {
          numerical_arrays: this.numericArrayDataIds,
          numericals: [],
          categoricals: [],
          subsets: store.getters.subsets
        }
      },
      validArgs () {
        return this.numericArrayDataIds.length > 0
      },
      margin () {
        const left = this.width / 5
        const top = this.height / 10
        const right = this.width / 10
        const bottom = 50
        return { left, top, right, bottom }
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return { width, height }
      },
      uniqueIds () {
        return [...new Set(this.results.data.map(d => d.id))]
      },
      uniqueVariables () {
        return [...new Set(this.results.data.map(d => d.variable))]
      },
      gridBox () {
        const width = this.padded.width / this.uniqueIds.length
        let height = this.padded.height / this.uniqueVariables.length
        height = height < width / 4 ? height : width / 4
        return { height, width }
      },
      scales () {
        const x = d3.scaleOrdinal()
          .domain(this.uniqueIds)
          .range(this.uniqueIds.map((d, i) => i * this.gridBox.width))
        const y = d3.scaleOrdinal()
          .domain(this.uniqueVariables)
          .range(this.uniqueVariables.map((d, i) => i * this.gridBox.height))
        return { x, y }
      },
      currentStats () {
        return this.results.stats.map(d => d[this.selectedSigMes])
      },
      sigScales () {
        const x = d3.scaleLinear()
          .domain(d3.extent(this.currentStats))
          .range([0, this.margin.left])
        const y = this.scales.y // has the same y scale than the heatmap grid
        return { x, y }
      },
      cells () {
        return this.results.data.map(d => {
          return {
            x: this.scales.x(d.id),
            y: this.scales.y(d.variable),
            width: this.gridBox.width,
            height: this.gridBox.height,
            fill: this.colorScale(1 / (1 + Math.pow(Math.E, -d.zscore))),
            tooltip: `
<div>
  <p>Identifier: ${d.id}</p>
  <p>Variable: ${d.variable}</p>
  <p>Value: ${d.value}</p>
  <p>z-Score ${d.zscore}</p>
</div>
`
          }
        })
      },
      sigBars () {
        return this.results.stats.map(d => {
          return {
            x: -this.sigScales.x(d[this.selectedSigMes]),
            y: this.sigScales.y(d.variable),
            width: this.sigScales.x(d[this.selectedSigMes]),
            height: this.gridBox.height,
            fill: d[this.selectedSigMes] < 0 ? '#0072ff' : '#ff006a',
            tooltip: '<div>' + Object.keys(d).map(key => {
              const selected = key === this.selectedSigMes ? '<span style="font-weight: bold;">[selected]<span> ' : ''
              return `<p>${selected}${key}: ${d[key]}</p>`
            }).join('') + '</div>'
          }
        })
      },
      labels () {
        const ids = this.uniqueIds.map(id => {
          const transform = `translate(${this.scales.x(id) + this.gridBox.width / 2}, -10)rotate(-45)`
          const fontSize = `${this.gridBox.width / 2}px`
          // noinspection JSSuspiciousNameCombination
          const text = truncateTextUntil(
            {text: id, font: `${this.gridBox.width / 2}px Roboto`, maxWidth: this.margin.top})
          return { transform, fontSize, text }
        })
        const variables = this.uniqueVariables.map(variable => {
          const transform = `translate(${this.padded.width + 10}, ${this.scales.y(variable) + this.gridBox.height})`
          const fontSize = `${this.gridBox.height}px`
          const text = truncateTextUntil(
            {text: variable, font: `${this.gridBox.height}px Roboto`, maxWidth: this.margin.right})
          return { transform, fontSize, text }
        })
        return { ids, variables }
      }
    },
    methods: {
      runAnalysisWrapper (args) {
        runAnalysis({task_name: 'compute-heatmap', args})
          .then(response => {
            const results = JSON.parse(response)
            const data = JSON.parse(results.data)
            const stats = JSON.parse(results.stats)
            results.data = Object.keys(data).map(key => data[key])
            results.stats = Object.keys(stats).map(key => stats[key])
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            deepFreeze(stats) // massively improve performance by telling Vue that the objects properties won't change
            this.results = results
          })
      },
      handleResize () {
        const container = this.$el.querySelector(`.fjs-vm-uid-${this._uid} .fjs-vis-container svg`)
        this.height = container.getBoundingClientRect().height
        this.width = container.getBoundingClientRect().width
      },
      update_numericArrayData (ids) {
        this.numericArrayDataIds = ids
      }
    },
    watch: {
      'args': {
        handler: function () {
          if (this.validArgs) {
            this.runAnalysisWrapper(this.args)
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
      DataBox,
      TaskView
    },
    directives: {
      tooltip
    }
  }
</script>

<style lang="sass" scoped>
  @import './src/assets/base.sass'

  *
    font-family: Roboto, sans-serif

  .fjs-heatmap
    height: 100%
    width: 100%
    display: flex
    flex-direction: column

    .fjs-parameter-container
      text-align: center

    .fjs-vis-container
      flex: 1
      display: flex
      svg
        flex: 1
        .fjs-cell
          stroke: none
          shape-rendering: crispEdges
        .fjs-cell:hover
          opacity: 0.4
        .fjs-sig-bar
          stroke-width: none
          shape-rendering: crispEdges
</style>
