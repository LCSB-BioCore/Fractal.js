<template>
  <div class="fjs-data-box">
    <label :for="`fjs-data-window-${_uid}`" :tooltip="tooltip">{{ header }}</label>
    <div :id="`fjs-data-window-${_uid}`" class="fjs-data-window">
      <div class="fjs-data-entry-container"
           :data-state="item.etl_state"
           v-for="item in items">

        <div class="fjs-data-entry-header">
          <input type="checkbox"
                 :data-id="item.task_id"
                 :checked="!!~selectedIDs.indexOf(item.task_id)" />
          <span :data-id="item.task_id"
                :data-state="item.etl_state"
                class="fjs-data-label"
                @click="toggleTaskId(item.task_id)">{{ item.label }}
          </span>
          <span class="fjs-options" @click="toggleDataEntryBody(item.task_id)">&#9776;</span>
        </div>

        <div class="fjs-data-entry-body" :data-state="item.etl_state" :data-id="item.task_id">
          <div class="fjs-action-btns">
            <span class="fjs-reload-btn" @click="reloadData(item.task_id)">&#8635;</span>
            <span class="fjs-delete-btn" @click="deleteData(item.task_id)">&#215;</span>
          </div>
          <autocomplete class="fjs-autocomplete"
                        v-on:select="updateFilter($event, item.task_id)"
                        :itemGetter="featureGetter(item.task_id)">
          </autocomplete>
          <span>{{ item.etl_message }}</span>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
  import store from '../../store/store'
  import $ from 'jquery'
  import 'devbridge-autocomplete'
  import Autocomplete from './Autocomplete.vue'
  export default {
    components: {Autocomplete},
    name: 'data-box',
    data () {
      return {
        selectedIDs: [],
        featureFilter: {}
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
        return store.getters.data
          .filter(item => ~this.dataType.split(',').map(s => s.trim()).indexOf(item.data_type))
      },
      transformedIDs () {
        return this.selectedIDs.map(id => `$${JSON.stringify({id, filters: { feature: this.featureFilter[id] }})}$`)
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
      featureGetter (taskID) {
        return async () => {
          const metaData = await store.getters.requestManager.getMetaData(taskID)
          return metaData.data.meta['features'] || []
        }
      },
      toggleDataEntryBody (taskID) {
        const $body = $(this.$el.querySelector(`.fjs-data-entry-body[data-id="${taskID}"]`))
        $body.slideToggle(500)
      },
      reloadData (taskID) {
        store.getters.requestManager.reloadData(taskID)
      },
      deleteData (taskID) {
        store.getters.requestManager.deleteData(taskID)
      },
      updateFilter (filter, taskID) {
        this.featureFilter[taskID] = filter
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
    margin: 1vh 0 1vh 0
    height: 15vh
    label
      text-align: right
    .fjs-data-window
      flex: 1
      border: 1px solid #fff
      border-radius: 3px
      overflow-y: scroll
      padding: 0.3vh 0.3vw 0.3vh 0.3vw
      .fjs-data-entry-container
        display: flex
        flex-direction: column
        .fjs-data-entry-header
          display: flex
          align-items: center
          justify-content: space-between
          cursor: pointer
          padding: 0.25vh 0.25vw 0.25vh 0.25vw
          .fjs-data-label
            display: inline-flex
            align-items: center
            width: 100%
            overflow: hidden
            overflow-wrap: break-word
            &[data-state="SUBMITTED"]
              animation: loadingColorCycle 2s infinite
            &[data-state="FAILURE"]
              color: #ff6565
        .fjs-data-entry-body
          display: none
          padding: 0.25vh 0.25vw 0.25vh 0.25vw
          > span
              color: #ff6565
          .fjs-action-btns
            display: flex
            flex-direction: row
            justify-content: space-around
            border: 1px solid #fff
            border-radius: 3px
            margin: 0 0 0.5vh 0
            span
              cursor: pointer
        .fjs-autocomplete
          text-align: center
  @keyframes loadingColorCycle
    0%
      opacity: 1
    50%
      opacity: 0
    100%
      opacity: 1
</style>
