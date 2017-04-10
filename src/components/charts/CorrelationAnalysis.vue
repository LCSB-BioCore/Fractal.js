<template>
  <div>
    <div class="data-box-container">
      <data-box header="X and Y variables"
                dataType="numerical"
                v-on:update="update_xyData">
      </data-box>
      <data-box header="Annotations"
                dataType="categorical"
                v-on:update="update_annotationData">
      </data-box>
    </div>
    <input
        id="run-analysis-btn"
        type="button"
        @click="createPlot"
        value="Run Analysis"
        :disabled="disabled"/>
  </div>
</template>


<script>
  import DataBox from '../DataBox.vue'
  import requestHandling from '../mixins/request-handling'
  export default {
    name: 'correlation-analysis',
    data () {
      return {
        xyData: [],
        annotationData: [],
        get args () {
          return {
            x: `$${this.xyData[0]}$`,
            y: `$${this.xyData[1]}$`
          }
        }
      }
    },
    computed: {
      disabled () {
        return this.xyData.length !== 2
      }
    },
    components: {
      DataBox
    },
    mixins: [
      requestHandling
    ],
    methods: {
      createPlot () {
        // function made available via requestHandling mixin
        this.runAnalysis({job_name: 'compute-correlation', args: this.args})
          .then(response => {
            console.log(response)
          })
          .catch(error => {
            console.error(error)
          })
      },
      update_xyData (ids) {
        this.xyData = ids
      },
      update_annotationData (ids) {
        this.annotationData = ids
      }
    }
  }
</script>


<style scoped>
  .data-box-container {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
  }

  #run-analysis-btn {
    width: 100%;
    height: 20px;
  }
</style>