<template>
  <div class="fjs-data-box">
    <span class="fjs-header-label">{{ header }}</span>
    <div class="fjs-data-window">
      <div class="fjs-item" v-for="item in items">

        <div class="fjs-item-head">
          <input type="checkbox" :value="item.task_id" v-model="checkedIds"/>
          <span class="fjs-item-label"
                 :data-state="item.state"
                 @click="toggleTaskId(item.task_id)">
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
  import 'devbridge-autocomplete'
  import Autocomplete from './Autocomplete.vue'
  export default {
    components: {Autocomplete},
    name: 'data-box',
    data () {
      return {
        checkedIds: [],
        featureFilter: {},
        expanded: {}
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
      }
    },
    computed: {
      items () {
        return store.getters.data
          .filter(item => ~this.dataType.split(',').map(s => s.trim()).indexOf(item.data_type))
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
      },
      'items': {
        handler: function (newItems) {
          const existingIDs = newItems.map(d => d.task_id)
          // this removes selected IDs when they expired in the back end
          this.checkedIds = this.checkedIds.filter(existingIDs.includes)
        }
      }
    },
    methods: {
      toggleTaskId (taskID) {
        const idx = this.checkedIds.indexOf(taskID)
        if (~idx) {
          this.checkedIds.splice(idx, 1)
        } else {
          this.checkedIds.push(taskID)
        }
      },
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
          cursor: pointer
          padding: 0.25vh 0 0.25vh 0.25vw
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
