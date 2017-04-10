<template>
  <div>
    <div class="data-box-container">
      <data-box data-type="numerical"></data-box>
      <data-box data-type="categorical"></data-box>
    </div>
    <input id="run-analysis-btn" type="button" @click="createPlot" value="Run Analysis" />
  </div>
</template>


<script>
  import DataBox from '../DataBox.vue'
  import requestHandling from '../mixins/request-handling'
  export default {
    name: 'correlation-analysis',
    data: function() {
      return {
        args: {

        }
      }
    },
    components: {
      DataBox
    },
    mixins: [
      requestHandling
    ],
    methods: {
      createPlot: function () {
        // function made available via requestHandling mixin
        this.runAnalysis({name: 'compute-correlation', args: this.args})
          .then(response => {
            console.log(response)
          })
          .catch(error => {
            console.error(error)
          })
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