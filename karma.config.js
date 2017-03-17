const webpackConfig = require('./webpack.config')

module.exports = config => {
  config.set({
    frameworks: ['jasmine'],
    files: [
      {pattern: 'test/**/*_test.js'}
    ],
    browsers: ['PhantomJS'],
    preprocessors: {
      'test/**/*_test.js': ['webpack', 'sourcemap']
    },
    webpack: webpackConfig,
    webpackMiddleware: {
      stats: 'errors-only'
    },
    singleRun: true,
    colors: true
  })
}
