<template>
  <div class="data-container">
    <div class="data-item" v-for="(item, index) in items">
      <input type="checkbox" :id="'data-check-' + index" :value="item.data_id" v-model="checkedItems"/>
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
    data: function() {
      return {
        checkedItems: []
      }
    },
    computed: {
      items: function() {
        return store.getters.data.filter(item => item.data_type === this.dataType)
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