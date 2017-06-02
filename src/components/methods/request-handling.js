import store from '../../store/store'

export default {
  methods: {
    async runAnalysis ({task_name, args}) {
      function timeout (ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
      }
      const rv1 = await store.getters.requestManager.createAnalysis({task_name, args})
      const taskID = rv1.data.task_id
      store.dispatch('setTask', {taskID, taskName: task_name, taskState: 'PENDING'})
      let counter = 0
      while (counter < 1000) {
        await timeout(++counter * 200)
        const rv2 = await store.getters.requestManager.getAnalysisStatus({taskID})
        const taskInfo = rv2.data
        store.dispatch('setTask', {taskID, taskName: task_name, taskState: taskInfo.state})
        if (taskInfo.state === 'SUCCESS') {
          return taskInfo.result
        } else if (taskInfo.state === 'FAILURE') {
          throw new Error(taskInfo.result)
        } else if (taskInfo.state === 'PENDING') {
        } else {
          throw new Error(`Analysis Task has unknown state: ${taskInfo.state}`)
        }
      }
    }
  }
}
