<template>
  <div class="fjs-task-view">
    <div class="fjs-state-container" v-for="task in incompleteTasks">
      <loader class="fjs-loader" :style="{opacity: task.taskState === 'SUBMITTED' ? 1 : 0}"></loader>
      <span class="fjs-submitted" v-if="task.taskState === 'SUBMITTED'">{{ task.taskName }}</span>
      <span class="fjs-failed" v-else>{{ task.taskMessage }}</span>
      <span class="fjs-cancel-btn" @click="cancelTask(task.taskID)">&#215;</span>
    </div>
  </div>
</template>

<script>
  import store from '../../store/store'
  import Loader from './Loader.vue'
  export default {
    name: 'task-view',
    components: {
      Loader
    },
    data () {
      return {
      }
    },
    computed: {
      tasks () {
        return store.getters.tasks
      },
      incompleteTasks () {
        return Object.keys(this.tasks)
          .filter(key => { return this.tasks[key].taskState !== 'SUCCESS' })
          .map(key => this.tasks[key])
      }
    },
    methods: {
      cancelTask (taskID) {
        store.getters.requestManager.cancelAnalysis({taskID})
      }
    }
  }
</script>

<style lang="sass" scoped>
  @import './../../../src/assets/base.sass'

  .fjs-task-view
    display: flex
    flex-direction: column
    justify-content: flex-start

    .fjs-state-container
      width: 100%
      display: flex
      flex-direction: row
      justify-content: space-between
      margin: 1% 0 1% 0
      .fjs-submitted
        max-width: 75%
      .fjs-failed
        color: #f0ff9b
        font-size: 0.75em
        max-width: 75%
      .fjs-cancel-btn
        font-size: 1em
        color: #ff9fa1
        cursor: pointer
</style>
