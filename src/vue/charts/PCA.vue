<template>
  <div class="fjs-correlation-analysis" @click="$emit('focus')">

    <control-panel class="fjs-control-panel" focus="focus">
      <data-box class="fjs-data-box"
                header="Features"
                dataType="numerical"
                v-on:update="update_featureData">
      </data-box>
      <data-box class="fjs-data-box"
                header="Categories"
                dataType="categorical"
                v-on:update="update_categoryData">
      </data-box>
    </control-panel>

    <chart class="fjs-chart">
      <svg :width="width"
           :height="height">
        <g :transform="`translate(${margin.left}, ${margin.top})`">
          <g class="fjs-boxplot-axis fjs-x-axis" :transform="`translate(0, ${padded.height})`"></g>
          <g class="fjs-boxplot-axis fjs-y-axis"></g>
          <circle class="fjs-point"
                  :cx="scales.x(point.x)"
                  :cy="scales.y(point.y)"
                  r="0.4%"
                  :fill="categoryColors[categories.indexOf(point.category) % categoryColors.length]"
                  :stroke="subsetColors[point.subset % subsetColors.length]"
                  :title="point.tooltip"
                  v-tooltip
                  v-for="point in points">
          </circle>
        </g>
      </svg>
    </chart>

  </div>
</template>

<script>
  import DataBox from '../components/DataBox.vue'
  import ControlPanel from '../components/ControlPanel.vue'
  import Chart from '../components/Chart.vue'
  import store from '../../store/store'
  import runAnalysis from '../mixins/run-analysis'
  import * as d3 from 'd3'
  import tooltip from '../directives/tooltip.js'
  import deepFreeze from 'deep-freeze-strict'
  export default {
    name: 'pca-analysis',
    data () {
      return {
        height: 0,
        width: 0,
        featureData: [],
        categoryData: [],
        results: {},
        categoryColors: d3.schemeCategory10,
        subsetColors: d3.schemeCategory10.slice().reverse()
      }
    },
    computed: {
      idFilter () {
        return store.getters.filter('ids')
      },
      args () {
        return {
          features: this.featureData,
          categories: this.categoryData,
          n_components: 2,
          whiten: false,
          id_filter: this.idFilter,
          subsets: store.getters.subsets
        }
      },
      validArgs () {
        return this.featureData.length > 1
      },
      margin () {
        const left = 10
        const top = 10
        const right = 50
        const bottom = 50
        return { left, top, right, bottom }
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return { width, height }
      },
      scales () {

      },
      points () {

      },
      axis () {

      }
    },
    watch: {
      'args': {
        handler: function () {
          if (this.validArgs) {
            this.runAnalysisWrapper(this.args)
          }
        }
      },
      'axis': {
        handler: function (newAxis) {
          this.$nextTick(() => {
            d3.select(this.$el.querySelector('.fjs-x-axis'))
              .call(newAxis.x)
              .selectAll('text')
              .attr('transform', 'rotate(20)')
            d3.select(this.$el.querySelector('.fjs-y-axis'))
              .call(newAxis.y)
          })
        }
      }
    },
    methods: {
      runAnalysisWrapper (args) {
        runAnalysis({task_name: 'compute-pca', args})
          .then(response => {
            const results = JSON.parse(response)
            results.data = JSON.parse(results.data)
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            this.results = results
          })
          .catch(error => console.error(error))
      },
      handleResize () {
        const container = this.$el.querySelector(`.fjs-chart svg`)
        // noinspection JSSuspiciousNameCombination
        this.height = container.getBoundingClientRect().width
        this.width = container.getBoundingClientRect().width
      },
      update_featureData (ids) {
        this.featureData = ids
      },
      update_categoryData (ids) {
        this.categoryData = ids
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
      Chart
    },
    directives: {
      tooltip
    }
  }
</script>

<style lang="sass" scoped>
  @import './src/assets/base.sass'

  .fjs-correlation-analysis
    height: 100%
    width: 100%
    .fjs-chart
      svg
        height: 100%
        width: 100%
</style>
