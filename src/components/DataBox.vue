<template>
  <div class="data-container">
    <div class="data-item" v-for="(item, index) in items">
      <input :id="'data-check-' + index" type="checkbox" />
      <label :for="'data-check-' + index">{{ item.description }}</label>
    </div>
  </div>
</template>

<script>
  import store from '../store/store'
  export default {
    name: 'data-box',
    props: [
      'dataType'
    ],
    computed: {
      items: function() {
        return store.state.loadedData.filter(item => item.dataType === this.dataType)
      }
    }
  }
</script>

<style scoped>
  .data-container {
    border: 1px solid #ccc;
    width: 300px;
    height: 200px;
    overflow-y: scroll;
    padding: 5px 5px 5px 5px;
  }
</style>