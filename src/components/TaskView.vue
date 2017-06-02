<template>
  <div class="fjs-task-state-container" v-if="pendingTasks.length || failedTasks.length">
    <div class="fjs-task-state-element" v-for="task in pendingTasks">
      <loader class="fjs-loader"></loader>
      <span class="fjs-task-info">{{ task.taskName }}</span>
      <span class="fjs-cancel-task-btn" @click="cancelTask(task.taskID)">&#215;</span>
    </div>
    <div class="fjs-task-state-element" v-for="task in failedTasks">
      <span>{{ task.taskName }}</span>
    </div>
  </div>
</template>

<script>
  import store from '../store/store'
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
      pendingTasks () {
        return Object.keys(this.tasks)
          .filter(taskID => this.tasks[taskID].taskState === 'PENDING')
          .map(taskID => this.tasks[taskID])
      },
      failedTasks () {
        return Object.keys(this.tasks)
          .filter(taskID => this.tasks[taskID].taskState === 'FAILURE')
          .map(taskID => this.tasks[taskID])
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
  .fjs-task-state-container
    display: flex
    flex-direction: column
    z-index: 1
    position: fixed
    bottom: 0
    right: 0
    color: #fff
    background-color: #000
    opacity: 0.8
    padding: 20px
    border-radius: 15px 0 0 0
    .fjs-task-state-element
      display: flex
      align-items: center
      .fjs-task-info
        margin: 0 0 0 5px
      .fjs-cancel-task-btn
        cursor: pointer
        margin: 0 0 0 20px
        color: #f00
        font-size: 30px
        font-weight: bold
</style>
