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
        </control-panel>
        <svg :height="height" :width="width">
            <g :transform="`translate(${margin.left}, ${margin.top})`">

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
    components: {DataBox, Chart, ControlPanel},
    mixins: [RunAnalysis],
    data () {
      return {
        height: 0,
        width: 0,
        durationVariables: [],
        groupVariables: [],
        observedVariables: [],
        estimator: 'KaplanMeier',
        results: {}
      }
    },
    computed: {
      args () {
        return {
          durations: this.durationVariables,
          categories: this.groupVariables,
          event_observed: this.observedVariables,
          estimator: this.estimator,
          id_filter: store.getters.filter('ids'),
          subsets: store.getters.subsets
        }
      },
      validArgs () {
        return this.durations.length === 1
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
      }
    },
    watch: {
      'args': {
        handler: function (newArgs) {
          if (this.validArgs) {
            this.runAnalysisWrapper(newArgs)
          }
        }
      }
    }
  }
</script>

<style lang="sass" scoped>
    @import '~assets/base.sass'

</style>

<!--CSS for dynamically created components-->
<style lang="sass">

</style>