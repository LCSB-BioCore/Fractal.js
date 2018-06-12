<template>
    <chart v-on:resize="resize">
        <control-panel class="fjs-control-panel" name="Survivalplot Panel">
            <data-box class="fjs-data-box"
                      header="Duration [numerical]"
                      :data-types="['numerical']"
                      v-on:update="updateDurationVariable">
            </data-box>
            <data-box class="fjs-data-box"
                      header="Groups (optional) [categorical]"
                      :data-types="['categorical']"
                      v-on:update="updateGroupVariable">
            </data-box>
            <data-box class="fjs-data-box"
                      header="Observed (optional) [categorical]"
                      :data-types="['categorical']"
                      v-on:update="updateObservedVariable">
            </data-box>
            <hr class="fjs-seperator"/>
            <fieldset class="fjs-fieldset">
                <legend>Estimator</legend>
                <div v-for="method in estimators">
                    <label>
                        <input type="radio" :value="method" v-model="estimator">
                        {{ method }}
                    </label>
                </div>
            </fieldset>
            <div>
                <label>
                    Ignore Subsets
                    <input type="checkbox" v-model="ignoreSubsets"/>
                </label>

            </div>
        </control-panel>
        <svg :height="height" :width="width">
            <g :transform="`translate(${margin.left}, ${margin.top})`">
                <g class="fjs-axis" ref="yAxis2" :transform="`translate(${padded.width}, 0)`"></g>
                <g class="fjs-axis" ref="xAxis2"></g>
                <g class="fjs-axis" ref="xAxis1" :transform="`translate(0, ${padded.height})`"></g>
                <g class="fjs-axis" ref="yAxis1"></g>
                <crosshair :width="padded.width" :height="padded.height"/>
                <g class="fjs-paths">
                    <path class="fjs-estimate-path"
                          :style="{stroke: path.color}"
                          :d="path.d" v-for="path in paths">
                    </path>
                    <path class="fjs-ci-path"
                          :style="{fill: path.color}"
                          :d="path.d" v-for="path in ciPaths">
                    </path>
                </g>
            </g>
        </svg>
    </chart>
</template>

<script>
  import ControlPanel from '../components/ControlPanel.vue'
  import Chart from '../components/Chart.vue'
  import DataBox from '../components/DataBox.vue'
  import RunAnalysis from '../mixins/run-analysis'
  import store from '../../store/store'
  import deepFreeze from 'deep-freeze-strict'
  import * as d3 from 'd3'
  import Crosshair from '../components/Crosshair.vue'
  export default {
    name: 'survivalplot',
    components: {Crosshair, DataBox, Chart, ControlPanel},
    mixins: [RunAnalysis],
    data () {
      return {
        height: 0,
        width: 0,
        durationVariables: [],
        groupVariables: [],
        observedVariables: [],
        estimator: 'KaplanMeier',
        estimators: ['KaplanMeier', 'NelsonAalen'],
        ignoreSubsets: false,
        groupColors: d3.schemeCategory10,
        results: {
          subsets: [],
          categories: [],
          stats: {}
        }
      }
    },
    computed: {
      args () {
        return {
          durations: this.durationVariables,
          categories: this.groupVariables,
          event_observed: this.observedVariables,
          estimator: this.estimator,
          id_filter: store.getters.filter('ids').value,
          subsets: this.ignoreSubsets ? [] : store.getters.subsets
        }
      },
      validArgs () {
        return this.durationVariables.length === 1
      },
      margin () {
        const left = this.width / 15
        const top = this.height / 15
        const right = this.width / 15
        const bottom = this.height / 15
        return {left, top, right, bottom}
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return {width, height}
      },
      dataRanges () {
        let timelineGlobalMin = Number.MAX_SAFE_INTEGER
        let timelineGlobalMax = Number.MIN_SAFE_INTEGER
        let estimateGlobalMin = Number.MAX_SAFE_INTEGER
        let estimateGlobalMax = Number.MIN_SAFE_INTEGER
        this.results.categories.forEach(category => {
          this.results.subsets.forEach(subset => {
            const [localTimelineMin, localTimelineMax] = d3.extent(this.results.stats[category][subset].timeline)
            timelineGlobalMin = localTimelineMin < timelineGlobalMin ? localTimelineMin : timelineGlobalMin
            timelineGlobalMax = localTimelineMax > timelineGlobalMax ? localTimelineMax : timelineGlobalMax
            const [localEstimateMin, localEstimateMax] = d3.extent(this.results.stats[category][subset].estimate)
            estimateGlobalMin = localEstimateMin < estimateGlobalMin ? localEstimateMin : estimateGlobalMin
            estimateGlobalMax = localEstimateMax > estimateGlobalMax ? localEstimateMax : estimateGlobalMax
          })
        })
        return { timelineGlobalMin, timelineGlobalMax, estimateGlobalMin, estimateGlobalMax }
      },
      scales () {
        const x = d3.scaleLinear()
          .domain([this.dataRanges.timelineGlobalMin, this.dataRanges.timelineGlobalMax])
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain([this.dataRanges.estimateGlobalMin, this.dataRanges.estimateGlobalMax])
          .range([this.padded.height, 0])
        return { x, y }
      },
      axis () {
        const x1 = d3.axisBottom(this.scales.x)
        const y1 = d3.axisLeft(this.scales.y)
        const x2 = d3.axisBottom(this.scales.x)
          .tickSizeInner(this.padded.height)
          .tickFormat('')
        const y2 = d3.axisLeft(this.scales.y)
          .tickSizeInner(this.padded.width)
          .tickFormat('')
        return { x1, x2, y1, y2 }
      },
      groups () {
        const groups = {}
        this.results.categories.forEach(category => {
          this.results.subsets.forEach(subset => {
            groups[this.getGroupName(category, subset)] = {}
          })
        })
        Object.keys(groups).forEach((key, i) => {
          groups[key].color = this.groupColors[i % this.groupColors.length]
        })
        return groups
      },
      paths () {
        const paths = []
        this.results.categories.forEach(category => {
          this.results.subsets.forEach(subset => {
            let path = ''
            this.results.stats[category][subset].estimate.forEach((d, i, arr) => {
              const stats = this.results.stats[category][subset]
              const x = this.scales.x(stats.timeline[i])
              if (i === 0) {
                path += `M ${x} ${this.scales.y(d)}`
              } else {
                path += `L ${x} ${this.scales.y(arr[i - 1])}`
                path += `L ${x} ${this.scales.y(d)}`
              }
            })
            paths.push({
              d: path,
              color: this.groups[this.getGroupName(category, subset)].color
            })
          })
        })
        return paths
      },
      ciPaths () {
        const paths = []
        this.results.categories.forEach(category => {
          this.results.subsets.forEach(subset => {
            const stats = this.results.stats[category][subset]
            let path = ''
            let backpath = ' Z '
            this.results.stats[category][subset].ci_upper.forEach((_, i) => {
              const x = this.scales.x(stats.timeline[i])
              if (i === 0) {
                return true
              } else if (i === 1) {
                path += `M ${x} ${this.scales.y(stats.ci_upper[i])} `
                backpath = ` L ${x} ${this.scales.y(stats.ci_lower[i])}` + backpath
              } else {
                path += `L ${x} ${this.scales.y(stats.ci_upper[i - 1])} `
                path += `L ${x} ${this.scales.y(stats.ci_upper[i])} `
                backpath = ` L ${x} ${this.scales.y(stats.ci_lower[i - 1])}` + backpath
                backpath = ` L ${x} ${this.scales.y(stats.ci_lower[i])}` + backpath
              }
            })
            paths.push({
              d: path + backpath,
              color: this.groups[this.getGroupName(category, subset)].color
            })
          })
        })
        return paths
      }
    },
    methods: {
      updateDurationVariable (ids) {
        this.durationVariables = ids
      },
      updateGroupVariable (ids) {
        this.groupVariables = ids
      },
      updateObservedVariable (ids) {
        this.observedVariables = ids
      },
      resize (width, height) {
        this.width = width
        this.height = height
      },
      runAnalysisWrapper (args) {
        this.runAnalysis('survival-analysis', args)
          .then(response => {
            const results = JSON.parse(response)
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            this.results = results
          })
          .catch(error => console.error(error))
      },
      getGroupName (category, subset) {
        return `${category} [s${subset + 1}]`
      }
    },
    watch: {
      'args': {
        handler: function (newArgs) {
          if (this.validArgs) {
            this.runAnalysisWrapper(newArgs)
          }
        }
      },
      'axis': {
        handler: function (newAxis) {
          this.$nextTick(() => {
            d3.select(this.$refs.xAxis1).call(newAxis.x1)
            d3.select(this.$refs.yAxis1).call(newAxis.y1)
            d3.select(this.$refs.yAxis2).call(newAxis.y2)
            d3.select(this.$refs.xAxis2).call(newAxis.x2)
          })
        }
      }
    }
  }
</script>

<style lang="sass" scoped>
    @import '~assets/base.sass'

    svg
        .fjs-paths
            path
                shape-rendering: crispEdges
            .fjs-estimate-path
                stroke-width: 2px
                fill: none
            .fjs-ci-path
                opacity: 0.4
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