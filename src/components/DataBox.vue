<template>
  <div id="data-box">
    <label for="data-window" :tooltip="tooltip">{{ header }}</label>
    <div id="data-window" style="height: 80%;">
      <div class="data-entry-container"
           :data-state="item.state"
           v-for="item in items">

        <div class="data-entry-header"
             :data-state="item.state"
             @click="toggleDataEntryBody(item.message, $event)">
          <input type="checkbox"
                 :id="'data-check-' + item.data_id"
                 :value="item.data_id"
                 v-model="selectedIDs"
                 @click="updateSelected"
                 v-if="item.state == 'SUCCESS'"/>
          <label :for="'data-check-' + item.data_id">
            {{ item.description }}
          </label>
        </div>

        <div class="data-entry-body">{{ item.message }}</div>

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
    methods: {
      updateSelected () {
        this.$emit('update', this.selectedIDs)
      },
      toggleDataEntryBody (message, $event) {
        if (message) {
          const $header = $($event.currentTarget)
          const $content = $header.next()
          $content.slideToggle(500)
        }
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

  .data-entry-container[data-state='SUCCESS'] {

  }

  .data-entry-container[data-state='FAILURE'] {

  }

  .data-entry-container[data-state='PENDING'] {

  }

  .data-entry-body {
    display: none;
    padding: 3px;
  }

  .data-entry-header {
    background: #eee;
    padding: 2px;
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 98%;
  }

  .data-entry-header label {
    width: 80%
  }

  .data-entry-header:nth-child(odd)[data-state="SUCCESS"] {

  }

  .data-entry-header[data-state="FAILURE"], .data-entry-header[data-state="FAILURE"] * {
    background: #ffcbcb;
    cursor: pointer;
  }

  .data-entry-header[data-state="PENDING"] {
    color: #bbb;
  }

</style>
