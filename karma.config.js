const webpackConfig = require('./webpack.config.js')

process.env.CHROME_BIN = require('puppeteer').executablePath()

module.exports = config => {
  config.set({
    frameworks: ['jasmine'],
    files: [
      {pattern: 'test/**/*-test.js'}
    ],
    browsers: ['ChromeHeadless'],
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
