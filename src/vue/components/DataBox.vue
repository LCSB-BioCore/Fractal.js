<template>
  <div class="fjs-data-box">
    <span class="fjs-header-label">{{ header }}</span>
    <div class="fjs-data-window">
      <div class="fjs-item" v-for="item in items">

        <div class="fjs-item-head">
          <input type="checkbox"
                 :value="item.task_id"
                 v-model="checkedIds"
                 :disabled="item.state === 'SUBMITTED'"/>
          <span class="fjs-item-label" :data-state="item.state">
            {{ item.label }}
          </span>
          <span class="fjs-item-options" @click="toggleItemBody(item.task_id)">&#9776;</span>
        </div>

        <div class="fjs-item-body" v-show="expanded[item.task_id]">
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
  import Autocomplete from './Autocomplete.vue'
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
      }
    },
    computed: {
      items () {
        return store.getters.data.filter(item => {
          return this.dataTypes.includes(item.data_type) &&
            ['SUBMITTED', 'SUCCESS', 'FAILURE'].includes(item.etl_state)
        })
      },
      transformedIDs () {
        return this.checkedIds.map(id => `$${JSON.stringify({id, filters: { feature: this.featureFilter[id] }})}$`)
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
      }
    },
    methods: {
      featureGetter (taskID) {
        return async () => {
          const metaData = await store.getters.requestManager.getMetaData(taskID)
          return metaData.data.meta['features'] || []
        }
      },
      toggleItemBody (taskID) {
        this.$set(this.expanded, taskID, !this.expanded[taskID])
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
    text-align: start
    margin: 1vh 0 1vh 0
    .fjs-data-window
      height: 10vh
      min-width: 15vw
      border: 1px solid #fff
      border-radius: 3px
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
              color: #ff6565
        .fjs-item-body
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
