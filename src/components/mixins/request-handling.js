import store from '../../store/store'

export default {
  methods: {
    async runAnalysis ({job_name, args}) {
      function timeout (ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
      }
      const jobID = await store.getters.requestManager.createAnalysis({job_name, args})
      let counter = 0
      while (counter < 1000) {
        await timeout(++counter * 200)
        const jobInfo = await store.getters.requestManager.getAnalysisStatus({jobID})
        if (jobInfo.state === 'SUCCESS') {
          return jobInfo.result
        } else if (jobInfo.state === 'FAILURE') {
          throw jobInfo.result
        } else if (jobInfo.state === 'PENDING') {
        } else {
          throw new Error(`Analysis Job has unknown state: ${jobInfo.state}`)
        }
      }
    }
  }
}
