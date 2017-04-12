<template>
  <div id="data-box">
    <label for="data-container" :tooltip="tooltip">{{ header }}</label>
    <div id="data-container" style="height: 80%;">
      <div class="data-item" v-for="(item, index) in items">
        <input type="checkbox"
               :id="'data-check-' + index"
               :value="item.data_id"
               v-model="selectedIDs"
               @click="updateSelected"/>
        <label :for="'data-check-' + index">{{ item.description }}</label>
      </div>
    </div>
  </div>
</template>

<script>
  import store from '../store/store'
  export default {
    name: 'data-box',
    data () {
      return {
        selectedIDs: []
      }
    },
    props: {
      dataType: {
        type: String,
        required: true
      },
      header: {
        type: String,
        required: true
      },
      tooltip: {
        type: String,
        required: false
      }
    },
    computed: {
      items () {
        return store.getters.data.filter(item => item.data_type === this.dataType)
      }
    },
    methods: {
      updateSelected () {
        this.$emit('update', this.selectedIDs)
      }
    }
  }
</script>

<style scoped>
  #data-box {
    width: 30%;
  }

  #data-container {
    border: 1px solid #ccc;
    border-radius: 8px;
    overflow-y: scroll;
    padding: 5px 5px 5px 5px;
  }

  #data-container .data-item:nth-child(odd) {
    background: #ccc;
  }
</style>