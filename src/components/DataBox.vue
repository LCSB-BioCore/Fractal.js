<template>
  <div id="data-box">
    <label for="data-container" :tooltip="tooltip">{{ header }}</label>
    <div id="data-container" style="height: 80%;">
      <div class="data-item"
           :data-state="item.state"
           v-for="item in items">
        <input type="checkbox"
               :id="'data-check-' + item.data_id"
               :value="item.data_id"
               v-model="selectedIDs"
               @click="updateSelected"
               v-if="item.state == 'SUCCESS'"/>
        <div class="info-box" v-if="item.state == 'FAILURE'">i</div>
        <label :for="'data-check-' + item.data_id">
          {{ item.description }}
        </label>
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
    },
    components: {

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
    font-size: 14px;
    overflow-y: scroll;
    padding: 5px 5px 5px 5px;
  }

  .data-item {
    background: #eee;
    padding: 2px;
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 98%;
  }

  .data-item label {
    width: 80%
  }

  .data-item:nth-child(odd)[data-state="SUCCESS"] {

  }

  .data-item[data-state="FAILURE"] {
    background: #ffcbcb;
  }

  .data-item[data-state="PENDING"] {
    color: #bbb;
  }

  .info-box {
    font-style: italic;
    float: left;
    margin: 0 3px 0 3px;
    height: 15px;
    width: 15px;
    background: white;
    border-radius: 10px;
    text-align: center;
  }
</style>
