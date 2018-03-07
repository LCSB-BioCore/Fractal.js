const webpack = require('webpack')
const path = require('path')
const mode = require('yargs').argv.mode
const VERSION = require('./package.json').version

let plugins = [
  new webpack.HotModuleReplacementPlugin()
]
let filename = ''
const library = 'fractal'

if (mode === 'production') {
  filename = `${library}-${VERSION}.min.js`
} else {
  filename = `${library}.js`
}

module.exports = {
  entry: [
    path.resolve(__dirname, 'src/main.js')
  ],
  devtool: '#source-map',
  devServer: {
    host: '0.0.0.0',
    port: '8080',
    hot: true,
    inline: true,
    publicPath: 'http://127.0.0.1:8080/',
    headers: { 'Access-Control-Allow-Origin': '*' }
  },
  plugins: plugins,
  output: {
    path: path.resolve(__dirname, 'lib'),
    library: library,
    libraryTarget: 'var',
    filename: filename,
    publicPath: 'http://localhost:8080/',
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
  }
}
