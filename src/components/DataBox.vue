<template>
  <div :class="`fjs-vm-root fjs-vm-root-${_uid}`">
    <label :for="`fjs-data-window-${_uid}`" :tooltip="tooltip">{{ header }}</label>
    <div :id="`fjs-data-window-${_uid}`" class="fjs-data-window">
      <div class="fjs-data-entry-container"
           :data-state="item.etl_state"
           v-for="item in items">
        <div class="fjs-data-entry-header"
             :data-state="item.etl_state">
          <span class="fjs-cross" v-if="item.etl_state === 'FAILURE'">&#xd7;</span>
          <input :id="`fjs-checkbox-${item.task_id}-${_uid}`"
                 type="checkbox"
                 :value="item.task_id"
                 v-model="selectedIDs"
                 v-if="item.etl_state === 'SUCCESS'"/>
          <label :for="`fjs-checkbox-${item.task_id}-${_uid}`">{{ item.label }}</label>
          <span class="fjs-options" @click="toggleDataEntryBody(item.task_id)">&#9776;</span>
        </div>
        <div class="fjs-data-entry-body" :data-state="item.etl_state" :data-id="item.task_id">
          <div class="fjs-action-btns">
            <button class="fjs-reload-btn" @click="reloadData(item.task_id)">&#8635;</button>
            <button class="fjs-delete-btn" @click="deleteData(item.task_id)">&#215;</button><br/>
          </div>
          {{ item.etl_message }}
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
      toggleDataEntryBody (taskID) {
        const $body = $(`.fjs-vm-root-${this._uid} .fjs-data-entry-body[data-id="${taskID}"]`)
        $body.slideToggle(500)
      },
      reloadData (taskID) {
        store.getters.requestManager.reloadData({taskID})
      },
      deleteData (taskID) {
        store.getters.requestManager.deleteData({taskID})
      }
    }
  }
</script>

<style lang="sass" scoped>
  .fjs-vm-root
    width: 40%
    height: 90%
    margin: 10px
    > label
      font-size: 16px
    .fjs-data-window
      height: 80%
      width: 100%
      border: 1px solid #ccc
      border-radius: 8px
      font-size: 14px
      overflow-y: scroll
      padding: 5px
    .fjs-data-entry-header
      background-color: #eee
      padding: 5px
      margin: 2px
      width: 95%
      > *
        display: inline-block
        vertical-align: middle
      label
        width: 85%
        word-break: keep-all
        overflow: hidden
        text-overflow: ellipsis
      &[data-state="FAILURE"]
        background-color: #ffcbcb
      &[data-state="PENDING"]
        color: #bbb
      .cross
        color: red
        padding: 5px
      .options
        cursor: pointer
        white-space: nowrap
    .fjs-data-entry-body
      display: none
      padding: 3px
      &[data-state="FAILURE"]
        background-color: #ffcbcb
      .fjs-action-btns
        text-align: center
        button
          height: 25px
          font-size: 14px
          font-weight: bold
</style>
