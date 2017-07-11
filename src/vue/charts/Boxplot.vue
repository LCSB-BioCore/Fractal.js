<template>
  <div :class="`fjs-boxplot fjs-vm-uid-${this._uid}`">
    <div class="fjs-data-box-container">
      <data-box class="fjs-data-box"
                header="Numerical Variables"
                dataType="numerical"
                v-on:update="update_numData">
      </data-box>
      <data-box class="fjs-data-box"
                header="Categorical Variables"
                dataType="categorical"
                v-on:update="update_catData">
      </data-box>
    </div>

    <div class="fjs-parameter-container">
    </div>

    <div class="fjs-vis-container">
      <svg :width="width"
           :height="height">
        <g :transform="`translate(${margin.left}, ${margin.top})`">
          <g class="fjs-boxplot-axis fjs-x-axis" :transform="`translate(0, ${padded.height})`"></g>
          <g class="fjs-boxplot-axis fjs-y-axis"></g>
          <g class="fjs-box"
             :transform="`translate(${scales.x(label)}, 0)`"
             :data-label="label"
             @mouseenter="showTooltip(label)"
             @mouseleave="hideTooltip(label)"
             v-for="label in Object.keys(results.statistics)" >
            <line class="fjs-upper-whisker"
                  :title="results.statistics[label].u_wsk"
                  :x1="- boxplotWidth / 6"
                  :y1="scales.y(results.statistics[label].u_wsk)"
                  :x2="boxplotWidth / 6"
                  :y2="scales.y(results.statistics[label].u_wsk)">
            </line>
            <line class="fjs-lower-whisker"
                  :title="results.statistics[label].l_wsk"
                  :x1="- boxplotWidth / 6"
                  :y1="scales.y(results.statistics[label].l_wsk)"
                  :x2="boxplotWidth / 6"
                  :y2="scales.y(results.statistics[label].l_wsk)">
            </line>
            <line class="fjs-upper-quartile"
                  :title="results.statistics[label].u_qrt"
                  :x1="- boxplotWidth / 2"
                  :y1="scales.y(results.statistics[label].u_qrt)"
                  :x2="boxplotWidth / 2"
                  :y2="scales.y(results.statistics[label].u_qrt)">
            </line>
            <line class="fjs-lower-quartile"
                  :title="results.statistics[label].l_qrt"
                  :x1="- boxplotWidth / 2"
                  :y1="scales.y(results.statistics[label].l_qrt)"
                  :x2="boxplotWidth / 2"
                  :y2="scales.y(results.statistics[label].l_qrt)">
            </line>
            <line class="fjs-median"
                  :title="results.statistics[label].median"
                  :x1="- boxplotWidth / 2"
                  :y1="scales.y(results.statistics[label].median)"
                  :x2="boxplotWidth / 2"
                  :y2="scales.y(results.statistics[label].median)">
            </line>
            <line class="fjs-antenna"
                  :x1="0"
                  :y1="scales.y(results.statistics[label].u_wsk)"
                  :x2="0"
                  :y2="scales.y(results.statistics[label].l_wsk)">
            </line>
            <rect class="fjs-above-median-box"
                  :x="- boxplotWidth / 2"
                  :y="scales.y(results.statistics[label].u_qrt) + 1"
                  :width="boxplotWidth"
                  :height="scales.y(results.statistics[label].median) - scales.y(results.statistics[label].u_qrt)">
            </rect>
            <rect class="fjs-below-median-box"
                  :x="- boxplotWidth / 2"
                  :y="scales.y(results.statistics[label].median)"
                  :width="boxplotWidth"
                  :height="scales.y(results.statistics[label].l_qrt) - scales.y(results.statistics[label].median) - 1">
            </rect>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<script>
  import DataBox from '../components/DataBox.vue'
  import store from '../../store/store'
  import requestHandling from '../methods/run-analysis'
  import * as d3 from 'd3'
  import TaskView from '../components/TaskView.vue'
  import deepFreeze from 'deep-freeze-strict'
  import utils from '../../services/utils'
  import tippy from 'tippy.js'
  export default {
    name: 'boxplot',
    data () {
      return {
        width: 0,
        height: 0,
        numData: [],
        catData: [],
        tooltips: {},
        results: {
          data: [],
          statistics: {}
        }
      }
    },
    computed: {
      args () {
        return {
          variables: this.numData,
          categories: this.catData,
          id_filter: [],
          subsets: store.getters.subsets
        }
      },
      validArgs () {
        return this.numData.length > 0
      },
      margin () {
        const left = 60
        const top = 10
        const right = 10
        const bottom = 100
        return { left, top, right, bottom }
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return { width, height }
      },
      numOfBoxplots () {
        return Object.keys(this.results.statistics).length
      },
      boxplotWidth () {
        const maxBoxplotWidth = this.padded.width / 4
        let boxplotWidth = this.padded.width / this.numOfBoxplots - this.padded.width * 0.05
        boxplotWidth = boxplotWidth > maxBoxplotWidth ? maxBoxplotWidth : boxplotWidth
        return boxplotWidth
      },
      scales () {
        const values = this.results.data.map(entry => this.results.variables.map(v => entry[v]))
        const flattened = [].concat.apply([], values)
        const extent = d3.extent(flattened)
        const padding = (extent[1] - extent[0]) / 10
        const x = d3.scalePoint()
          .domain(Object.keys(this.results.statistics))
          .range([0, this.padded.height])
          .padding(1)
        const y = d3.scaleLinear()
          .domain([extent[0] - padding, extent[1] + padding])
          .range([this.padded.width, 0])
        return { x, y }
      },
      axis () {
        const x = d3.axisBottom(this.scales.x).tickFormat(d => utils.truncate({fullStr: d, strLen: 20}))
        const y = d3.axisLeft(this.scales.y)
        return { x, y }
      }
    },
    // IMPORTANT: If the code within the watchers does interact with the DOM the code should be wrapped into a $nextTick
    // statement. This helps with the integration into the Vue component lifecycle. E.g.: an animation can't be
    // applied to an element that does not exist yet.
    watch: {
      'args': {
        handler: function (newArgs, oldArgs) {
          // if our data selection change we will want to re-initialize the current view
          const init = JSON.stringify(newArgs.variables) !== JSON.stringify(oldArgs.variables) ||
            JSON.stringify(newArgs.categories) !== JSON.stringify(oldArgs.categories)
          if (this.validArgs) {
            this.runAnalysisWrapper({init, args: this.args})
          }
        }
      },
      'axis': {
        handler: function (newAxis) {
          this.$nextTick(() => {
            d3.select(`.fjs-vm-uid-${this._uid} .fjs-x-axis`)
              .call(newAxis.x)
              .selectAll('text')
              .attr('transform', 'rotate(20)')
            d3.select(`.fjs-vm-uid-${this._uid} .fjs-y-axis`)
              .call(newAxis.y)
          })
        }
      }
    },
    methods: {
      showTooltip (label) {
        // https://github.com/atomiks/tippyjs/issues/74
        Object.keys(this.tooltips).forEach(label => this.tooltips[label].forEach(d => d.tip.destroyAll()))
        this.tooltips = {}

        const defaultOptions = {
          performance: true,
          theme: 'light',
          arrow: true,
          trigger: 'manual'
        }
        const upperWhisker = document.querySelector(`.fjs-vm-uid-${this._uid} .fjs-box[data-label="${label}"] .fjs-upper-whisker`)
        const lowerWhisker = document.querySelector(`.fjs-vm-uid-${this._uid} .fjs-box[data-label="${label}"] .fjs-lower-whisker`)
        const upperQuartile = document.querySelector(`.fjs-vm-uid-${this._uid} .fjs-box[data-label="${label}"] .fjs-upper-quartile`)
        const lowerQuartile = document.querySelector(`.fjs-vm-uid-${this._uid} .fjs-box[data-label="${label}"] .fjs-lower-quartile`)
        const median = document.querySelector(`.fjs-vm-uid-${this._uid} .fjs-box[data-label="${label}"] .fjs-median`)
        this.tooltips[label] = [
          { tip: tippy(upperWhisker, Object.assign({position: 'right'}, defaultOptions)), el: upperWhisker },
          { tip: tippy(lowerWhisker, Object.assign({position: 'right'}, defaultOptions)), el: lowerWhisker },
          { tip: tippy(upperQuartile, Object.assign({position: 'left'}, defaultOptions)), el: upperQuartile },
          { tip: tippy(lowerQuartile, Object.assign({position: 'left'}, defaultOptions)), el: lowerQuartile },
          { tip: tippy(median, Object.assign({position: 'right'}, defaultOptions)), el: median }
        ]
        this.tooltips[label].forEach(d => {
          d.tip.show(d.tip.getPopperElement(d.el))
        })
      },
      hideTooltip (label) {
        this.tooltips[label].forEach(d => d.tip.hide(d.tip.getPopperElement(d.el)))
      },
      update_numData (ids) {
        this.numData = ids
      },
      update_catData (ids) {
        this.catData = ids
      },
      handleResize () {
        const container = this.$el.querySelector(`.fjs-vm-uid-${this._uid} .fjs-vis-container svg`)
        // noinspection JSSuspiciousNameCombination
        this.height = container.getBoundingClientRect().width
        this.width = container.getBoundingClientRect().width
      },
      runAnalysisWrapper ({args}) {
        // function made available via requestHandling mixin
        this.runAnalysis({task_name: 'compute-boxplot', args})
          .then(response => {
            const results = JSON.parse(response)
            const data = JSON.parse(results.data)
            results.data = Object.keys(data).map(key => data[key])
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            this.results = results
            this.handleResize()
          })
          .catch(error => console.error(error))
      }
    },
    components: {
      DataBox,
      TaskView
    },
    mixins: [
      requestHandling
    ],
    mounted () {
      window.addEventListener('resize', this.handleResize)
      this.handleResize()
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.handleResize)
    }
  }
</script>

<style lang="sass" scoped>
  @import './src/assets/base.sass'

  *
    font-family: Roboto, sans-serif

  .fjs-boxplot
    height: 100%
    width: 100%
    display: flex
    flex-direction: column

    .fjs-data-box-container
      height: 160px
      display: flex
      justify-content: space-around

    .fjs-vis-container
      flex: 1
      display: flex
      .fjs-tooltip
        position: absolute
      svg
        flex: 1
        .fjs-box
          .fjs-median, .fjs-lower-quartile, .fjs-upper-quartile
            opacity: 1
          .fjs-lower-whisker, .fjs-upper-whisker, .fjs-antenna
            shape-rendering: crispEdges
            stroke: black
            stroke-width: 2px
          .fjs-below-median-box
            stroke: none
            fill: rgb(205, 232, 254)
            shape-rendering: crispEdges
          .fjs-above-median-box
            stroke: none
            fill: rgb(180, 221, 253)
            shape-rendering: crispEdges
</style>


<!--CSS for dynamically created components-->
<style lang="sass">
  .fjs-boxplot-axis
    shape-rendering: crispEdges
    stroke-width: 2px
    .tick
      shape-rendering: crispEdges
      text
        font-size: 18px
    line
      stroke: #999
  .fjs-x-axis
    .tick
      text
        text-anchor: start
</style>
