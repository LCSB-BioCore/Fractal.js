const webpack = require('webpack')
const path = require('path')
const env = require('yargs').argv.env

let plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NamedModulesPlugin()
]
let filename = ''
const library = 'fractal'

if (env === 'production') {
  plugins.push(new webpack.optimize.UglifyJsPlugin({minimize: true}))
  plugins.push(new webpack.DefinePlugin({'process.env': {NODE_ENV: '"production"'}}))
  filename = library + '.min.js'
} else {
  filename = library + '.js'
}

module.exports = {
  entry: [
    path.resolve(__dirname, 'src/main.js')
  ],
  devtool: '#inline-source-map',
  devServer: {
    hot: true,
    inline: true,
    publicPath: 'http://localhost:8080/',
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
        loader: 'vue-loader',
        include: [
          path.resolve(__dirname, 'src', 'components')
        ],
        options: {
          // compile the <script></script> part of vue components with babel
          loaders: {
            js: 'babel-loader'
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'test')
        ]
      },
      {
        test: /\.css$/,
        loader: 'css-loader',
        include: [
          path.resolve(__dirname, 'src', 'assets')
        ]
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    }
  }
}
