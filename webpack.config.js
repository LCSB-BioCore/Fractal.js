const path = require('path')

const config = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, './lib'),
    library: 'fractal',
    filename: 'fractal.js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    }
  }
}

module.exports = config
