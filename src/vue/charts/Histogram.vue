<template>
    <chart v-on:resize="resize">
        <control-panel class="fjs-control-panel" name="Histogram Panel">
            <data-box class="fjs-data-box"
                      header="Numerical Variable"
                      :data-types="['numerical']"
                      v-on:update="update_numericData"
                      :valid-range="[1, 1]">
            </data-box>
            <data-box class="fjs-data-box"
                      header="Categorical Variables"
                      :data-types="['categorical']"
                      v-on:update="update_categoricData"
                      :valid-range="[0, Infinity]">
            </data-box>
            <hr class="fjs-seperator"/>
            <div class="fjs-params">
                <label>
                    Bandwidth Factor:
                    <input type="number" min="0.1" step="0.1" v-model.lazy.number="params.bwFactor"/>
                </label>
                <label>
                    Number of Bins:
                    <input type="number" min="2" step="1" v-model.lazy.number="params.numBins"/>
                </label>
            </div>
        </control-panel>
        <svg :height="height" :width="width">
            <g :transform="`translate(${margin.left}, ${margin.top})`">
                <html2svg :right="padded.width">
                    <draggable>
                        <div class="fjs-legend">
                            <div class="fjs-legend-element" v-for="group in groups">
                                <svg width="1vw" height="1vw">
                                    <rect width="1vw" height="1vw" :fill="group.color"></rect>
                                </svg>
                                <span>{{ group.name }}</span>
                            </div>
                        </div>
                    </draggable>
                </html2svg>
                <g class="fjs-hist-axis" ref="xAxis" :transform="`translate(0, ${this.padded.height})`"></g>
                <g class="fjs-hist-axis" ref="yAxis"></g>
                <crosshair :width="padded.width" :height="padded.height"></crosshair>
                <g class="fjs-brush" ref="brush"></g>
                <g class="fjs-histogram" v-for="histogram in histograms">
                    <rect class="fjs-bin"
                          :x="bin.x"
                          :y="bin.y"
                          :height="bin.height"
                          :width="bin.width"
                          :fill="histogram.color"
                          v-for="bin in histogram.bins">
                    </rect>
                </g>
                <g class="fjs-distributions" v-for="histogram in histograms">
                    <polyline class="fjs-distribution"
                              :stroke="histogram.color"
                              :points="histogram.distribution">
                    </polyline>
                </g>
            </g>
        </svg>
    </chart>
</template>

<script>
  import DataBox from '../components/DataBox.vue'
  import ControlPanel from '../components/ControlPanel.vue'
  import Chart from '../components/Chart.vue'
  import store from '../../store/store'
  import RunAnalysis from '../mixins/run-analysis'
  import * as d3 from 'd3'
  import deepFreeze from 'deep-freeze-strict'
  import Crosshair from '../components/Crosshair.vue'
  import Html2svg from '../components/HTML2SVG.vue'
  import Draggable from '../components/Draggable.vue'
  import tooltip from '../directives/tooltip'
  import _ from 'lodash'
  export default {
    name: 'histogram',
    components: {
      Draggable,
      Html2svg,
      ControlPanel,
      DataBox,
      Chart,
      Crosshair
    },
    mixins: [
      RunAnalysis
    ],
    directives: {
      tooltip
    },
    data () {
      return {
        height: 0,
        width: 0,
        params: {
          numericData: [],
          categoryData: [],
          bwFactor: 0.5,
          numBins: 10
        },
        results: {
          label: '',
          subsets: [],
          categories: [],
          stats: {}
        },
        groupColors: d3.schemeCategory10
      }
    },
    computed: {
      idFilter () {
        return store.getters.filter('ids')
      },
      args () {
        return {
          bw_factor: this.params.bwFactor,
          num_bins: this.params.numBins,
          id_filter: this.idFilter.value,
          subsets: store.getters.subsets,
          data: this.params.numericData,
          categories: this.params.categoryData
        }
      },
      margin () {
        const left = this.width / 20
        const top = this.height / 20
        const right = this.width / 20
        const bottom = this.height / 15
        return {left, top, right, bottom}
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return {width, height}
      },
      dataRanges () {
        let binEdgeGlobalMin = Number.MAX_SAFE_INTEGER
        let binEdgeGlobalMax = Number.MIN_SAFE_INTEGER
        let histGlobalMin = Number.MAX_SAFE_INTEGER
        let histGlobalMax = Number.MIN_SAFE_INTEGER
        this.groups.forEach(group => {
          const [localBinEdgeMin, localBinEdgeMax] = d3.extent(this.results.stats[group.category][group.subset].bin_edges)
          binEdgeGlobalMin = localBinEdgeMin < binEdgeGlobalMin ? localBinEdgeMin : binEdgeGlobalMin
          binEdgeGlobalMax = localBinEdgeMax > binEdgeGlobalMax ? localBinEdgeMax : binEdgeGlobalMax
          const [localHistMin, localHistMax] = d3.extent(this.results.stats[group.category][group.subset].hist)
          histGlobalMin = localHistMin < histGlobalMin ? localHistMin : histGlobalMin
          histGlobalMax = localHistMax > histGlobalMax ? localHistMax : histGlobalMax
        })
        return {binEdgeGlobalMin, binEdgeGlobalMax, histGlobalMin, histGlobalMax}
      },
      groups () {
        const groups = []
        this.results.categories.forEach(category => {
          this.results.subsets.forEach(subset => {
            if (!_.has(this.results.stats, [category, subset])) {
              return true
            }
            groups.push({
              name: this.getGroupName(category, subset),
              subset,
              category
            })
          })
        })
        groups.forEach((group, i) => {
          group.color = this.groupColors[i % this.groupColors.length]
        })
        return groups
      },
      scales () {
        const x = d3.scaleLinear()
          .domain([this.dataRanges.binEdgeGlobalMin, this.dataRanges.binEdgeGlobalMax])
          .range([0, this.padded.width])
        const y = d3.scaleLinear()
          .domain([this.dataRanges.histGlobalMin, this.dataRanges.histGlobalMax])
          .range([this.padded.height, 0])
        return {x, y}
      },
      axis () {
        const x = d3.axisBottom(this.scales.x)
        const y = d3.axisLeft(this.scales.y)
        return {x, y}
      },
      histograms () {
        return this.groups.map(group => {
          const binEdges = this.results.stats[group.category][group.subset].bin_edges
          const hist = this.results.stats[group.category][group.subset].hist
          const bins = hist.map((d, i) => {
            return {
              x: this.scales.x(binEdges[i]),
              y: this.scales.y(d),
              width: this.scales.x(binEdges[i + 1]) - this.scales.x(binEdges[i]),
              height: this.padded.height - this.scales.y(d)
            }
          })
          const dist = this.results.stats[group.category][group.subset].dist
          const xScale = d3.scaleLinear()
            .domain([0, dist.length - 1])
            .range([bins[0].x, bins[bins.length - 1].x + bins[bins.length - 1].width])
          const yScale = d3.scaleLinear()
            .domain(d3.extent(dist))
            .range([this.padded.height, 0])
          const distribution = dist.map((d, i) => {
            return xScale(i) + ',' + yScale(d)
          })
          return { bins, distribution, color: group.color }
        })
      }
    },
    methods: {
      runAnalysisWrapper (args) {
        this.runAnalysis('compute-histogram', args)
          .then(response => {
            const results = JSON.parse(response)
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            this.results = results
          })
          .catch(error => console.error(error))
      },
      resize (width, height) {
        this.width = width
        this.height = height
      },
      update_numericData (ids) {
        this.params.numericData = ids[0]
      },
      update_categoricData (ids) {
        this.params.categoryData = ids
      },
      getGroupName (category, subset) {
        return `${this.results.label} [${category}] [s${subset + 1}]`
      }
    },
    watch: {
      'args': {
        handler: function (newArgs) {
          this.runAnalysisWrapper(newArgs)
        }
      },
      'axis': {
        handler: function (newAxis) {
          this.$nextTick(() => {
            d3.select(this.$refs.xAxis).call(newAxis.x)
            d3.select(this.$refs.yAxis).call(newAxis.y)
          })
        }
      }
    }
  }
</script>

<style lang="sass" scoped>
    @import '~assets/base.sass'

    .fjs-params
        display: flex
        flex-direction: column

    .fjs-legend
        .fjs-legend-element
            > svg
                margin-right: 0.5vw
            display: flex
            align-items: center

    .fjs-histogram
        .fjs-bin
            stroke: black
            stroke-width: 0
            shape-rendering: crispEdges
            opacity: 0.5

    .fjs-distributions
        .fjs-distribution
            fill: none
            stroke-width: 0.2em
            opacity: 0.8
</style>

<style lang="sass">
    @import '~assets/d3.sass'
    .fjs-hist-axis
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