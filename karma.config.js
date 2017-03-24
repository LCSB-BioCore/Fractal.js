const webpackConfig = require('./webpack.config.js')

module.exports = config => {
  config.set({
    frameworks: ['jasmine'],
    files: [
      {pattern: 'test/**/*-test.js'}
    ],
    browsers: ['Chrome'],
    preprocessors: {
      'test/**/*-test.js': ['webpack', 'sourcemap']
    },
    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: false,
      stats: {
        color: true
      }
    },
    reporter: ['progress'],
    singleRun: false,
    colors: true
  })
}
