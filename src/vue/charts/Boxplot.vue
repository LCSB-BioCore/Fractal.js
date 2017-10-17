<template>
  <chart v-on:resize="resize">

    <control-panel class="fjs-control-panel">
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
      <hr class="fjs-seperator"/>
      <div class="fjs-parameter-container">
        <input id="fjs-show-data-check" type="checkbox" v-model="params.showData"/>
        <label for="fjs-show-data-check">Show Points</label>
        <br/>
        <input id="fjs-jitter-data-check" type="checkbox" v-model="params.jitter"/>
        <label for="fjs-jitter-data-check">Jitter Data</label>
        <br/>
        <input id="fjs-show-kde-check" type="checkbox" v-model="params.showKDE"/>
        <label for="fjs-show-kde-check">Show Density Est.</label>
      </div>
    </control-panel>

    <svg :width="width"
         :height="height">
      <rect x="0" y="0" :height="height" :width="width" style="opacity: 0;" @click="resetFilter"></rect>
      <g :transform="`translate(${margin.left}, ${margin.top})`">
        <g class="fjs-boxplot-axis fjs-x-axis" :transform="`translate(0, ${padded.height})`"></g>
        <g class="fjs-boxplot-axis fjs-y-axis"></g>
        <g class="fjs-box"
           :transform="`translate(${scales.x(label)}, 0)`"
           v-tooltip="{position: 'bottom'}"
           :title="label"
           :data-label="label"
           @click="setIDFilter(label)"
           @mouseenter="showTooltip(label)"
           @mouseleave="hideTooltip(label)"
           v-for="label in labels" >
          <line class="fjs-upper-whisker"
                :title="results.statistics[label].u_wsk"
                v-tooltip="{position: 'right'}"
                :x1="- boxplotWidth / 6"
                :y1="tweened.boxes[label].u_wsk"
                :x2="boxplotWidth / 6"
                :y2="tweened.boxes[label].u_wsk">
          </line>
          <line class="fjs-lower-whisker"
                :title="results.statistics[label].l_wsk"
                v-tooltip="{position: 'right'}"
                :x1="- boxplotWidth / 6"
                :y1="tweened.boxes[label].l_wsk"
                :x2="boxplotWidth / 6"
                :y2="tweened.boxes[label].l_wsk">
          </line>
          <line class="fjs-upper-quartile"
                :title="results.statistics[label].u_qrt"
                v-tooltip="{position: 'left'}"
                :x1="- boxplotWidth / 2"
                :y1="tweened.boxes[label].u_qrt"
                :x2="boxplotWidth / 2"
                :y2="tweened.boxes[label].u_qrt">
          </line>
          <line class="fjs-lower-quartile"
                :title="results.statistics[label].l_qrt"
                v-tooltip="{position: 'left'}"
                :x1="- boxplotWidth / 2"
                :y1="tweened.boxes[label].l_qrt"
                :x2="boxplotWidth / 2"
                :y2="tweened.boxes[label].l_qrt">
          </line>
          <line class="fjs-median"
                :title="results.statistics[label].median"
                v-tooltip="{position: 'right'}"
                :x1="- boxplotWidth / 2"
                :y1="tweened.boxes[label].median"
                :x2="boxplotWidth / 2"
                :y2="tweened.boxes[label].median">
          </line>
          <line class="fjs-antenna"
                :x1="0"
                :y1="tweened.boxes[label].u_wsk"
                :x2="0"
                :y2="tweened.boxes[label].l_wsk">
          </line>
          <rect class="fjs-above-median-box"
                :x="- boxplotWidth / 2"
                :y="tweened.boxes[label].u_qrt"
                :width="boxplotWidth"
                :height="tweened.boxes[label].median - tweened.boxes[label].u_qrt">
          </rect>
          <rect class="fjs-below-median-box"
                :x="- boxplotWidth / 2"
                :y="tweened.boxes[label].median"
                :width="boxplotWidth"
                :height="tweened.boxes[label].l_qrt - tweened.boxes[label].median">
          </rect>
          <circle class="fjs-points"
                  :title="point.tooltip"
                  v-tooltip="{arrow: true, theme: 'light'}"
                  :cx="point.jitter"
                  :cy="scales.y(point.value)"
                  r="0.4%"
                  v-for="point in points[label]"
                  v-if="params.showData">
          </circle>
          <polyline class="fjs-kde"
                    :points="kdePolyPoints[label]"
                    v-if="params.showKDE">
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
  import runAnalysis from '../mixins/run-analysis'
  import * as d3 from 'd3'
  import { TimelineLite } from 'gsap'
  import deepFreeze from 'deep-freeze-strict'
  import { truncateTextUntil } from '../mixins/utils'
  import tooltip from '../directives/tooltip'
  export default {
    name: 'boxplot',
    data () {
      return {
        width: 0,
        height: 0,
        numData: [],
        catData: [],
        hasSetFilter: false,
        tooltips: {
          boxes: {}
        },
        params: {
          showData: false,
          jitter: false,
          showKDE: false
        },
        results: {
          data: [],
          statistics: {}
        },
        tweened: {
          boxes: {}
        }
      }
    },
    computed: {
      idFilter () {
        return store.getters.filter('ids')
      },
      args () {
        return {
          features: this.numData,
          categories: this.catData,
          id_filter: this.idFilter,
          subsets: store.getters.subsets
        }
      },
      validArgs () {
        return this.numData.length > 0
      },
      margin () {
        const left = 10
        const top = 10
        const right = this.width / 20
        const bottom = this.height * 0.3
        return { left, top, right, bottom }
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return { width, height }
      },
      labels () {
        return Object.keys(this.results.statistics).sort()
      },
      points () {
        const points = {}
        this.labels.forEach(label => {
          let [feature, category, subset] = label.split('//')
          subset = parseInt(subset.substring(1)) - 1  // revert subset string formatting
          points[label] = this.results.data
            .filter(d => d.subset === subset &&
              d.feature === feature &&
              d.category === category &&
              typeof d.value === 'number')
            .map(d => {
              return {
                id: d.id,
                value: d.value,
                jitter: this.params.jitter ? Math.random() * this.boxplotWidth / 2 : this.boxplotWidth / 2,
                subset: d.subset,
                category: d.category,
                get tooltip () {
                  return `
<div>
  <p>${d.feature}: ${this.value}</p>
  <p>Category: ${this.category}</p>
  <p>Subset: ${this.subset + 1}</p>
</div>
`
                }
              }
            })
        })
        return points
      },
      boxes () {
        const boxes = {}
        this.labels.forEach(label => {
          boxes[label] = {
            u_wsk: this.scales.y(this.results.statistics[label].u_wsk),
            l_wsk: this.scales.y(this.results.statistics[label].l_wsk),
            u_qrt: this.scales.y(this.results.statistics[label].u_qrt),
            l_qrt: this.scales.y(this.results.statistics[label].l_qrt),
            median: this.scales.y(this.results.statistics[label].median)
          }
        })
        return boxes
      },
      numOfBoxplots () {
        return this.labels.length
      },
      boxplotWidth () {
        const maxBoxplotWidth = this.padded.width / 4
        const minBoxplotWidth = 10
        let boxplotWidth = this.padded.width / this.numOfBoxplots - this.padded.width * 0.05
        boxplotWidth = boxplotWidth > maxBoxplotWidth ? maxBoxplotWidth : boxplotWidth
        boxplotWidth = boxplotWidth < minBoxplotWidth ? minBoxplotWidth : boxplotWidth
        return boxplotWidth
      },
      scales () {
        const values = this.results.data.map(d => d.value)
        const flattened = [].concat.apply([], values)
        const extent = d3.extent(flattened)
        const padding = (extent[1] - extent[0]) / 20
        const x = d3.scalePoint()
          .domain(this.labels)
          .range([0, this.padded.width])
          .padding(0.5)
        const y = d3.scaleLinear()
          .domain([extent[0] - padding, extent[1] + padding])
          .range([this.padded.height, 0])
        return { x, y }
      },
      kdePolyPoints () {
        const polyPoints = {}
        this.labels.forEach(label => {
          polyPoints[label] = this.results.statistics[label].kde.map((d, i) => {
            return -this.kdeScales[label].y(d) + ',' + this.kdeScales[label].x(i)
          }).join(' ')
        })
        return polyPoints
      },
      kdeScales () {
        const polyPoints = {}
        this.labels.forEach(label => {
          const x = d3.scaleLinear()
            .domain([0, this.results.statistics[label].kde.length - 1])
            .range([this.scales.y(this.results.statistics[label].l_wsk),
              this.scales.y(this.results.statistics[label].u_wsk)])
          const y = d3.scaleLinear()
            .domain(d3.extent(this.results.statistics[label].kde))
            .range([0, this.boxplotWidth / 2])
          polyPoints[label] = { x, y }
        })
        return polyPoints
      },
      axis () {
        const x = d3.axisBottom(this.scales.x).tickFormat(d => {
          // noinspection JSSuspiciousNameCombination
          return truncateTextUntil({text: d, font: `0.875em Roboto`, maxWidth: this.margin.bottom})
        })
        const y = d3.axisRight(this.scales.y)
          .tickSizeInner(this.padded.width)
        return { x, y }
      }
    },
    // IMPORTANT: If the code within the watchers does interact with the DOM the code should be wrapped into a $nextTick
    // statement. This helps with the integration into the Vue component lifecycle. E.g.: an animation can't be
    // applied to an element that does not exist yet.
    watch: {
      'boxes': {
        handler: function (newBoxes) {
          const labels = Object.keys(newBoxes)
          const timeline = new TimelineLite()
          labels.forEach(label => {
            if (typeof this.tweened.boxes[label] === 'undefined') {
              this.$set(this.tweened.boxes, label, newBoxes[label])
            } else {
              timeline.to(this.tweened.boxes[label], store.getters.animation ? 0.5 : 0, newBoxes[label], 0)
            }
          })
          timeline.play()
        }
      },
      'args': {
        handler: function () {
          if (this.validArgs && !this.hasSetFilter) {
            this.runAnalysisWrapper(this.args)
          }
          this.hasSetFilter = false
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
      getTippyInstances (label) {
        const event = document.createEvent('Event')
        event.initEvent('mouseover', true, true)
        return [
          this.$el.querySelector(`.fjs-box[data-label="${label}"] .fjs-upper-whisker`),
          this.$el.querySelector(`.fjs-box[data-label="${label}"] .fjs-lower-whisker`),
          this.$el.querySelector(`.fjs-box[data-label="${label}"] .fjs-upper-quartile`),
          this.$el.querySelector(`.fjs-box[data-label="${label}"] .fjs-lower-quartile`),
          this.$el.querySelector(`.fjs-box[data-label="${label}"] .fjs-median`)
        ].map(el => {
          el.dispatchEvent(event)  // populate tooltips
          const uuid = el.getAttribute('data-uuid')
          return { el, tip: this._tippyInstances[uuid] }
        })
      },
      showTooltip (label) {
        this.getTippyInstances(label).forEach(d => d.tip.show(d.tip.getPopperElement(d.el)))
      },
      hideTooltip (label) {
        this.getTippyInstances(label).forEach(d => d.tip.hide(d.tip.getPopperElement(d.el)))
      },
      update_numData (ids) {
        this.numData = ids
      },
      update_catData (ids) {
        this.catData = ids
      },
      setIDFilter (label) {
        store.dispatch('setFilter', {filter: 'ids', value: this.points[label].map(d => d.id)})
        this.hasSetFilter = true
      },
      resetFilter () {
        store.dispatch('setFilter', {filter: 'ids', value: []})
        this.hasSetFilter = true
      },
      resize ({height, width}) {
        this.height = height
        this.width = width
      },
      runAnalysisWrapper (args) {
        runAnalysis({task_name: 'compute-boxplot', args})
          .then(response => {
            const results = JSON.parse(response)
            results.data = JSON.parse(results.data)
            deepFreeze(results) // massively improve performance by telling Vue that the objects properties won't change
            this.results = results
          })
          .catch(error => console.error(error))
      }
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
  @import './../../../src/assets/base.sass'

  svg
    .fjs-box
      .fjs-median, .fjs-lower-quartile, .fjs-upper-quartile
        opacity: 1
      .fjs-lower-whisker, .fjs-upper-whisker, .fjs-antenna
        shape-rendering: crispEdges
        stroke: black
        stroke-width: 1px
      .fjs-below-median-box
        stroke: none
        fill: rgb(205, 232, 254)
        shape-rendering: crispEdges
      .fjs-above-median-box
        stroke: none
        fill: rgb(180, 221, 253)
        shape-rendering: crispEdges
    .fjs-points
      stroke: white
      stroke-width: 1px
    .fjs-points:hover
      opacity: 0.4
    .fjs-kde
      fill: none
      stroke: black
      stroke-width: 0.2%
</style>


<!--CSS for dynamically created components-->
<style lang="sass">
  .fjs-boxplot-axis
    shape-rendering: crispEdges
    .tick
      shape-rendering: crispEdges
      text
        font-size: 0.75em
    line
      stroke: #E2E2E2
    path
      stroke: none
    .fjs-x-axis
      .tick
        text
          text-anchor: start
          font-size: 0.75em
</style>
