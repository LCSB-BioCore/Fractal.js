import store from '../../store/store'

/**
 * A helper method to submit an analysis.
 * This method returns a promise that resolves into the statistic results of the task once it is finished.
 * Please pay special attention to the `args` syntax.
 * @param task_name The name to execute. For instance `compute-correlation`
 * @param args An object containing all parameters for the task. Strings wrapped in '$' characters are treated as
 * data ids. The backend will attempt to replace them with a Python Pandas DataFrame.
 * Example args = {method: 'sum', x: '$1234-5678-12345678$'} will replace x with a DataFrame, if available. This
 * value is usually retrieved from the data-box component, which will emit an `update` signal containing currently
 * selected data ids. Note that Arrays of '$' wrapped strings are also valid.
 * @returns {Promise.<void>} An ES6 promise. Resolves into the result of the analysis.
 */
async function runAnalysis ({task_name, args}) {
  function timeout (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  const rv1 = await store.getters.requestManager.createAnalysis({task_name, args})
  const taskID = rv1.data.task_id
  store.dispatch('setTask', {
    taskID,
    taskName: task_name,
    taskState: 'SUBMITTED'
  })
  let counter = 0
  while (counter++ < 1000) {
    await timeout(400)
    const rv2 = await store.getters.requestManager.getAnalysisStatus({taskID})
    const taskInfo = rv2.data
    if (taskInfo.state === 'SUCCESS') {
      store.dispatch('setTask', {
        taskID,
        taskName: task_name,
        taskState: taskInfo.state
      })
      return taskInfo.result
    } else if (taskInfo.state === 'FAILURE') {
      store.dispatch('setTask', {
        taskID,
        taskName: task_name,
        taskState: taskInfo.state,
        taskMessage: taskInfo.result
      })
      throw new Error(taskInfo.result)
    } else if (taskInfo.state === 'SUBMITTED') {
      store.dispatch('setTask', {
        taskID,
        taskName: task_name,
        taskState: taskInfo.state})
    } else {
      throw new Error(`Analysis Task has unknown state: ${taskInfo.state}`)
    }
  }
}

// This code is here because of: https://github.com/babel/babel/issues/3786
export default runAnalysis
