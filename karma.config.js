const webpackConfig = require('./webpack.config')

module.exports = config => {
  config.set({
    frameworks: ['jasmine'],
    files: [
      {pattern: 'test/**/*-test.js'}
    ],
    browsers: ['PhantomJS'],
    preprocessors: {
      'test/**/*-test.js': ['webpack']
    },
    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: false,
      stats: {
        color: true
      }
    },
    singleRun: true,
    colors: true
  })
}
