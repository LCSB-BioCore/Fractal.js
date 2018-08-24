const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'lib'),
    library: 'fractalis',
    libraryTarget: 'var',
    filename: 'fractal.js',
    hotUpdateChunkFilename: 'hot/hot-update.js',
    hotUpdateMainFilename: 'hot/hot-update.json'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        exclude: /node_modules/,
        loader: 'vue-loader',
        options: {
          loaders: {
            sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax'
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.sass$/,
        exclude: /node_modules/,
        loader: 'style-loader!css-loader!sass-loader?indentedSyntax'
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      'assets': path.resolve(__dirname, 'src/assets')
    }
  },
  performance: {
    hints: false
  },
  devtool: '#source-map',
  context: __dirname,
  target: 'web',
  devServer: {
    host: '0.0.0.0',
    port: '8080',
    hot: true,
    inline: true,
    headers: { 'Access-Control-Allow-Origin': '*' }
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
}
