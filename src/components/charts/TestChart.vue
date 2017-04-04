<template>
  <div>
    {{ greeting }}
    <data-box></data-box>
  </div>
</template>


<script>
  import DataBox from '../DataBox.vue'
  export default {
    name: 'test-chart',
    data () {
      return {
        greeting: 'Hello World!'
      }
    },
    components: {
      DataBox
    }
  }
</script>


<style scoped>

</style>