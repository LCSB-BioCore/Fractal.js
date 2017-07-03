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
  import { TweenLite } from 'gsap'
  import svgtooltip from '../directives/v-svgtooltip'
  import TaskView from '../components/TaskView.vue'
  import deepFreeze from 'deep-freeze-strict'
  export default {
    name: 'boxplot',
    data () {
      return {
        width: 0,
        height: 0,
        numData: [],
        catData: [],
        results: {}
      }
    },
    computed: {
      args () {
        return {
          variables: this.numData.map(d => `$${d}$`),
          categories: this.catData.map(d => `$${d}$`),
          subsets: store.getters.subsets
        }
      },
      validArgs () {
        return this.numData.length > 0
      },
      margin () {
        const left = 10
        const top = 10
        const right = 10
        const bottom = 10
        return { left, top, right, bottom }
      },
      padded () {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
        return { width, height }
      },
      boxplotWidth () {
        return this.padded.width / this.results.numOfBoxplots - this.results.numOfBoxplots
      }
    },
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
      }
    },
    methods: {
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
          })
          .catch(error => console.error(error))
      }
    },
    components: {
      DataBox,
      TaskView
    },
    mixins: [
      requestHandling,
      svgtooltip
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
      svg
        flex: 1
</style>
