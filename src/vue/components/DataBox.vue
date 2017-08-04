<template>
  <div class="fjs-data-box">
    <label :for="`fjs-data-window-${_uid}`" :tooltip="tooltip">{{ header }}</label>
    <div :id="`fjs-data-window-${_uid}`" class="fjs-data-window">
      <div class="fjs-data-entry-container" :data-state="item.etl_state" v-for="item in items">

        <div class="fjs-data-entry-header"
             :class="{'fjs-selected': !!~selectedIDs.indexOf(item.task_id)}"
             :data-state="item.etl_state">
          <span :data-id="item.task_id" @click="toggleTaskId(item.task_id)">{{ item.label }}</span>
          <span class="fjs-options" @click="toggleDataEntryBody(item.task_id)">&#9776;</span>
        </div>

        <div class="fjs-data-entry-body" :data-state="item.etl_state" :data-id="item.task_id">
          <div class="fjs-action-btns">
            <span class="fjs-reload-btn" @click="reloadData(item.task_id)">&#8635;</span>
            <span class="fjs-delete-btn" @click="deleteData(item.task_id)">&#215;</span>
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
      },
      transformedIDs () {
        return this.selectedIDs.map(d => `$${d}$`)
      }
    },
    watch: {
      'transformedIDs': {
        handler: function (newTransformedIDs, oldTransformedIDs) {
          // avoid emitting signals and thus triggering watchers if selected ids didn't change
          if (JSON.stringify(newTransformedIDs) !== JSON.stringify(oldTransformedIDs)) {
            this.$emit('update', newTransformedIDs)
          }
        }
      },
      'items': {
        handler: function (newItems) {
          const existingIDs = newItems.map(d => d.task_id)
          // this removes selected IDs when they expired in the back end
          console.log(existingIDs)
          console.log(this.selectedIDs.filter(id => existingIDs.indexOf(id) !== -1))
          this.selectedIDs = this.selectedIDs.filter(id => existingIDs.indexOf(id) !== -1)
        }
      }
    },
    methods: {
      toggleTaskId (taskID) {
        const idx = this.selectedIDs.indexOf(taskID)
        if (~idx) {
          this.selectedIDs.splice(idx, 1)
        } else {
          this.selectedIDs.push(taskID)
        }
      },
      toggleDataEntryBody (taskID) {
        const $body = $(this.$el.querySelector(`.fjs-data-entry-body[data-id="${taskID}"]`))
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
    display: flex
    justify-content: space-around
    flex-direction: column
    width: 100%
    text-align: start
    margin: 10px 0 10px 0
    > label
      font-size: 1rem
    .fjs-data-window
      flex: 1
      border: 1px solid #fff
      border-radius: 8px
      font-size: 0.875rem
      overflow-y: scroll
      padding: 8px
      .fjs-data-entry-container
        display: flex
        flex-direction: column
        .fjs-data-entry-header
          display: flex
          justify-content: space-between
          cursor: pointer
          padding: 4px
          margin: 2px 0 2px 0
          &[data-state="FAILURE"]
            background-color: #cc4040
        .fjs-selected
          background-color: rgb(16, 95, 190)
        .fjs-data-entry-body
          display: none
          padding: 1%
          &[data-state="FAILURE"]
            background-color: #cc4040
          .fjs-action-btns
            display: flex
            flex-direction: row
            justify-content: space-around
            span
              padding: 10px
              cursor: pointer
              font-size: 1.4rem
</style>
