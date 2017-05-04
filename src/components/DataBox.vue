<template>
  <div id="data-box">
    <label for="data-window" :tooltip="tooltip">{{ header }}</label>
    <div id="data-window" style="height: 80%;">
      <div class="data-entry-container"
           :data-state="item.state"
           v-for="item in items">
        <div class="data-entry-header"
             :data-state="item.state">
          <span class="cross" v-if="item.state === 'FAILURE'">&#xd7;</span>
          <input type="checkbox"
                 :id="'data-check-' + item.data_id"
                 :value="item.data_id"
                 v-model="selectedIDs"
                 v-if="item.state === 'SUCCESS'"/>
          <label :for="'data-check-' + item.data_id">
            {{ item.label }}
          </label>
          <span class="options" @click="toggleDataEntryBody(item.data_id)">&#9776;</span>
        </div>

        <div class="data-entry-body" :data-state="item.state" :data-id="item.data_id">
          <div class="action-btns">
            <button class="reload-btn" @click="reloadData(item.data_id)">&#8635;</button>
            <button class="delete-btn" @click="deleteData(item.data_id)">&#215;</button><br/>
          </div>
          {{ item.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import store from '../store/store'
  import $ from 'jquery'
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
    watch: {
      'selectedIDs': {
        handler: function (newSelectedIDs) {
          this.$emit('update', newSelectedIDs)
        }
      }
    },
    methods: {
      toggleDataEntryBody (dataID) {
        const $body = $(`.data-entry-body[data-id="${dataID}"]`)
        $body.slideToggle(500)
      },
      reloadData (dataID) {
        store.getters.requestManager.reloadData({dataID})
      },
      deleteData (dataID) {
        store.getters.requestManager.deleteData({dataID})
      }
    }
  }
</script>

<style scoped>
  #data-box {
    width: 30%;
  }

  #data-window {
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 14px;
    overflow-y: scroll;
    padding: 5px 5px 5px 5px;
  }

  .data-entry-header {
    background-color: #eee;
    padding: 5px;
    margin: 2px;
    width: 95%;
  }

  .data-entry-header > * {
    display: inline-block;
    vertical-align: middle;
  }

  .data-entry-header label {
    width: 85%;
    word-break: keep-all;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .data-entry-header:nth-child(odd)[data-state="SUCCESS"] {

  }

  .data-entry-header[data-state="FAILURE"] {
    background-color: #ffcbcb;
  }

  .data-entry-header[data-state="PENDING"] {
    color: #bbb;
  }

  .data-entry-body {
    display: none;
    padding: 3px;
  }

  .data-entry-body[data-state="FAILURE"] {
    background-color: #ffcbcb;
  }

  .action-btns {
    text-align: center;
  }

  .action-btns button {
    height: 25px;
    font-size: 14px;
    font-weight: bold;
  }

  .cross {
    color: red;
    padding: 5px;
  }

  .options {
    cursor: pointer;
    white-space: nowrap;
  }
</style>
