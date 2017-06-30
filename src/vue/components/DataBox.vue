<template>
  <div :class="`fjs-data-box fjs-vm-uid-${_uid}`">
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
  import store from '../../store/store'
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
        handler: function (newSelectedIDs, oldSelectedIDs) {
          // avoid emitting signals and thus triggering watchers if selected ids didn't change
          if (JSON.stringify(newSelectedIDs) !== JSON.stringify(oldSelectedIDs)) {
            this.$emit('update', newSelectedIDs)
          }
        }
      },
      'items': {
        handler: function (newItems) {
          const existingIDs = newItems.map(d => d.task_id)
          // this removes selected IDs when they expired in the back end
          this.selectedIDs = this.selectedIDs.filter(id => existingIDs.indexOf(id) !== -1)
        }
      }
    },
    methods: {
      toggleDataEntryBody (taskID) {
        const $body = $(`.fjs-vm-uid-${this._uid} .fjs-data-entry-body[data-id="${taskID}"]`)
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
  .fjs-data-box
    width: 50%
    display: flex
    flex-direction: column
    text-align: center
    margin: 10px
    > label
      font-size: 16px
    .fjs-data-window
      flex: 1
      border: 1px solid #ccc
      border-radius: 8px
      font-size: 14px
      overflow-y: scroll
      padding: 5px
      .fjs-data-entry-container
        display: flex
        flex-direction: column
        .fjs-data-entry-header
          display: flex
          background-color: #eee
          padding: 5px
          margin: 2px
          label
            flex: 1
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
          padding: 5px
          &[data-state="FAILURE"]
            background-color: #ffcbcb
          .fjs-action-btns
            text-align: center
            button
              height: 25px
              font-size: 14px
              font-weight: bold
</style>
