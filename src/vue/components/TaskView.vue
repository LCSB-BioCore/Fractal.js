<template>
  <div class="fjs-task-view" v-if="pendingTasks.length || failedTasks.length">
    <span class="fjs-toggle-btn" @click="toggleView" v-html="toggleButton"></span>
    <div class="fjs-task-state-container">
      <div class="fjs-task-state-element fjs-pending" :key="task" v-for="task in pendingTasks">
        <loader class="fjs-loader"></loader>
        <span class="fjs-task-name">{{ task.taskName }}</span>
        <span class="fjs-cancel-task-btn" @click="cancelTask(task.taskID)">&#215;</span>
      </div>
      <div class="fjs-task-state-element fjs-failed" v-for="task in failedTasks">
        <span class="fjs-task-name">{{ task.taskName }}</span>
        <span class="fjs-cancel-task-btn" @click="cancelTask(task.taskID)">&#215;</span>
        <span class="fjs-task-message">{{ task.taskMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script>
  import store from '../../store/store'
  import Loader from './Loader.vue'
  import $ from 'jquery'
  export default {
    name: 'task-view',
    components: {
      Loader
    },
    data () {
      return {
        isMinimized: false
      }
    },
    computed: {
      toggleButton () {
        return this.isMinimized ? '&#9650;' : '&#9660;'
      },
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
      },
      toggleView () {
        this.isMinimized = !this.isMinimized
        const $body = $(this.$el.querySelector('.fjs-task-state-container'))
        $body.slideToggle(500)
      }
    }
  }
</script>

<style lang="sass" scoped>
  .fjs-task-view
    z-index: 1
    position: fixed
    bottom: 0
    right: 0
    width: 300px
    color: #fff
    background-color: #333333
    padding: 20px
    border-radius: 15px 0 0 0
    .fjs-toggle-btn
      cursor: pointer
    .fjs-task-state-container
      display: flex
      flex-direction: column
      .fjs-task-state-element
        display: flex
        align-items: center
        padding: 0 0 5px 0
        .fjs-task-name
          margin: 0 0 0 5px
        .fjs-cancel-task-btn
          cursor: pointer
          margin: 0 0 0 20px
          color: #f00
          font-size: 30px
          font-weight: bold
      .fjs-failed
        .fjs-task-name
          color: #f00
        .fjs-task-message
          margin: 0 0 0 10px
          font-size: 10px

</style>
