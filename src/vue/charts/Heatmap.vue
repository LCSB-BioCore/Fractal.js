<template>
  <div :class="`fjs-heatmap fjs-vm-uid-${this._uid}`">
    <div class="fjs-data-box-container">
      <data-box class="fjs-data-box"
                header="Numerical Array Data"
                dataType="numerical_array"
                v-on:update="update_numericArrayData">
      </data-box>
    </div>

    <div class="fjs-parameter-container">
    </div>

    <div class="fjs-vis-container">
      <svg :height="height" :width="width">
        <g :transform="`translate(${margin.left}, ${margin.top})`">
          <rect class="fjs-cell"
                :x="cell.x"
                :y="cell.y"
                :height="cell.height"
                :width="cell.width"
                v-tooltip="{title: cell.tooltip}"
                v-for="cell in cells">
          </rect>
        </g>
      </svg>
    </div>
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
  export default {
    name: 'heatmap',
    data () {
      return {
        width: 500,
        height: 500,
        numericArrayDataIds: [],
        results: {
          data: []
        }
      }
    },
    computed: {
      args () {
        return {
          numerical_arrays: this.numericArrayDataIds,
          numericals: [],
          categoricals: []
        }
      },
      margin () {
        const left = 50
        const top = 50
        const right = 50
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
      cells () {
        return this.results.data.map(d => {
          return {
            x: this.scales.x(d.id),
            y: this.scales.y(d.variable),
            width: this.gridBox.width,
            height: this.gridBox.height,
            tooltip: `
<div>
  <p>Identifier: ${d.id}</p>
  <p>Variable: ${d.variable}</p>
  <p>Value: ${d.value}</p>
</div>
`
          }
        })
      }
    },
    methods: {
      runAnalysisWrapper (args) {
        runAnalysis({task_name: 'compute-heatmap', args})
          .then(response => {
            const results = JSON.parse(response)
            const data = JSON.parse(results.data)
            results.data = Object.keys(data).map(key => data[key])
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
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
        handler: function (newArgs, oldArgs) {
          if (JSON.stringify(newArgs) !== JSON.stringify(oldArgs)) {
            this.runAnalysisWrapper(newArgs)
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

    .fjs-data-box-container
      height: 160px
      display: flex
      justify-content: space-around

    .fjs-parameter-container
      text-align: center

    .fjs-vis-container
      flex: 1
      display: flex
      svg
        flex: 1
        .fjs-cell
          stroke: #fff
          stroke-width: 1px
          shape-rendering: crispEdges
        .fjs-cell:hover
          opacity: 0.4
</style>