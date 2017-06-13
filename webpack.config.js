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
        exclude: /node_modules/,
        options: {
          loaders: {
            sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax' // <style lang="sass">
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
        loader: 'style-loader!css-loader!sass-loader?indentedSyntax'
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    }
  }
}
