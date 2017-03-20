const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, 'src/main.js'),
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'lib'),
    library: 'fractal',
    libraryTarget: 'var',
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
