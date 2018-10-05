const webpackConfig = require('./webpack.config.js')

webpackConfig.devtool = '#inline-source-map'

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'test/test-index.js'
    ],
    preprocessors: {
      'test/test-index.js': ['webpack', 'sourcemap']
    },
    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: false,
      stats: {
        color: true
      }
    },
    reporters: ['spec'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['FirefoxHeadless'],
    singleRun: true,
    concurrency: Infinity
  })
}
