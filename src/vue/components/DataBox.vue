<template>
  <div class="fjs-data-box">
    <div class="fjs-header">
      <span class="fjs-header-label">{{ header }}</span>
      <span class="fjs-error-text" v-if="!isInValidRange">Please select between {{ validRange[0] }} and {{ validRange[1] }} variables</span>
    </div>
    <div class="fjs-data-window" :class="{'fjs-invalid-range-window': !isInValidRange}">
      <div class="fjs-item" v-for="item in items">

        <div class="fjs-item-head">
          <input type="checkbox"
                 :value="item.task_id"
                 v-model="checkedIds"
                 :disabled="item.etl_state !== 'SUCCESS'"/>
          <span class="fjs-item-label" :data-state="item.etl_state">
            {{ (item.etl_state === 'SUBMITTED' ? 'LOADING: ' : item.etl_state === 'FAILURE' ? 'ERROR: ' : '') + item.label }}
          </span>
          <span class="fjs-item-options" @click="toggleItemBody(item.task_id)">&#9776;</span>
        </div>

        <div class="fjs-item-body" v-show="expanded[item.task_id]">
          <div class="fjs-action-btns">
            <i class="material-icons" @click="reloadData(item.task_id)">replay</i>
            <i class="material-icons" @click="copyData(item.task_id)">content_copy</i>
            <i class="material-icons" @click="deleteData(item.task_id)">delete</i>
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
  import Autocomplete from './Autocomplete.vue'
  import _ from 'lodash'
  export default {
    components: {
      Autocomplete
    },
    name: 'data-box',
    data () {
      return {
        checkedIds: [],
        featureFilter: {},
        expanded: {}
      }
    },
    props: {
      dataTypes: {
        type: Array,
        required: true
      },
      header: {
        type: String,
        required: true
      },
      validRange: {
        type: Array,
        required: false,
        default: () => [0, Infinity]
      }
    },
    computed: {
      items () {
        return store.getters.data.filter(item => {
          return this.dataTypes.includes(item.data_type) &&
            ['SUBMITTED', 'SUCCESS', 'FAILURE'].includes(item.etl_state)
        })
      },
      existing_ids () {
        return this.items.map(item => item.task_id)
      },
      transformedIDs () {
        return this.checkedIds
          .filter(id => this.existing_ids.includes(id))
          .map(id => `$${JSON.stringify({id, filters: { feature: this.featureFilter[id] }})}$`)
      },
      isInValidRange () {
        return this.checkedIds.length >= this.validRange[0] && this.checkedIds.length <= this.validRange[1]
      }
    },
    watch: {
      'transformedIDs': {
        handler: function (newTransformedIDs, oldTransformedIDs) {
          // avoid emitting signals and thus triggering watchers if selected ids didn't change
          if (this.isInValidRange && !_.isEqual(newTransformedIDs, oldTransformedIDs)) {
            this.$emit('update', newTransformedIDs)
          }
        }
      }
    },
    methods: {
      featureGetter (taskID) {
        return async () => {
          const metaData = await store.getters.requestManager.getMetaData(taskID)
          return metaData.data.meta.features || []
        }
      },
      toggleItemBody (taskID) {
        this.$set(this.expanded, taskID, !this.expanded[taskID])
      },
      reloadData (taskID) {
        store.getters.requestManager.reloadData(taskID)
      },
      copyData (taskID) {
        store.getters.requestManager.getMetaData(taskID).then(metaData => {
          const descriptor = JSON.stringify(metaData.data.meta.descriptor)
          window.prompt('Copy to clipboard: Ctrl+C or Cmd+C', descriptor)
        })
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
    text-align: start
    margin: 1vh 0 1vh 0
    .fjs-header
      display: flex
      flex-direction: column
      .fjs-error-text
        color: #f0ff9b
    .fjs-data-window
      height: 10vh
      min-width: 15vw
      border: 1px solid #fff
      overflow-y: scroll
      padding: 0.3vh 17px 0.3vh 0.3vw
      .fjs-item
        display: flex
        flex-direction: column
        .fjs-item-head
          display: flex
          padding: 0.25vh 0 0.25vh 0.25vw
          input
            cursor: pointer
          .fjs-item-options
            cursor: pointer
          .fjs-item-label
            text-overflow: ellipsis
            display: inline-flex
            align-items: center
            overflow: hidden
            width: 100%
            &[data-state="SUBMITTED"]
              animation: loadingColorCycle 2s infinite
            &[data-state="FAILURE"]
              color: #f0ff9b
        .fjs-item-body
          padding: 0.25vh 0.25vw 0.25vh 0.25vw
          > span
              color: #f0ff9b
          .fjs-action-btns
            display: flex
            flex-direction: row
            justify-content: space-around
            border: 1px solid #fff
            border-radius: 3px
            margin: 0 0 0.5vh 0
            i
              cursor: pointer
              font-size: 1.5em
        .fjs-autocomplete
          text-align: center
    .fjs-invalid-range-window
      border-color: #f0ff9b
  @keyframes loadingColorCycle
    0%
      opacity: 1
    50%
      opacity: 0
    100%
      opacity: 1
</style>
