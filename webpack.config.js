const webpack = require('webpack')
const path = require('path')
const env = require('yargs').argv.env

let plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NamedModulesPlugin()
]
let filename = ''
const library = 'fractal'

if (env === 'build') {
  plugins.push(new webpack.optimize.UglifyJsPlugin({minimize: true}))
  filename = library + '.min.js'
} else {
  filename = library + '.js'
}

module.exports = {
  entry: [
    'babel-polyfill',
    path.resolve(__dirname, 'src/main.js')
  ],
  devtool: '#inline-source-map',
  devServer: {
    hot: true,
    inline: true,
  },
  plugins: plugins,
  output: {
    path: path.resolve(__dirname, 'lib'),
    library: library,
    libraryTarget: 'var',
    filename: filename,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        exclude: /node_modules/,
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
        ],
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
