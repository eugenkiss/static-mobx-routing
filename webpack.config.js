const path = require('path')
const webpack = require('webpack')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const PORT = '5001'

const isBuild = process.env['npm_lifecycle_event'] === 'build'
const isProd = process.env.ENV === 'production'
const debug = !isBuild

module.exports = function makeWebpackConfig() {
  const config = {}

  if (isBuild) {
    config.devtool = 'source-map'
  } else {
    config.devtool = '#eval-source-map'
  }

  config.entry = [
    './src/app/index'
  ]

  config.output = {
    path: root('build'),
    publicPath: isBuild ? '/' : `http://localhost:${PORT}/`,
    filename: isBuild ? 'js/[name].[hash].js' : 'js/[name].js',
    chunkFilename: isBuild ? '[id].[hash].chunk.js' : '[id].chunk.js',
  }

  config.resolve = {
    modules: [root(), 'node_modules'],
    extensions: ['.ts', '.js', '.jsx', '.tsx'],
    alias: {
      'app': root('src', 'app'),
    }
  }

  config.module = {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        include: root('src', 'app')
      },
      { test: /mobx-react-devtools/, loader: isProd ? 'null-loader' : 'noop-loader' },
      { test: /\.html$/, loader: 'raw-loader' },
    ]
  }

  config.plugins = [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(isBuild ? 'production' : 'dev'), // To enable React's optimizations
        'ENV': JSON.stringify(process.env.ENV), // For distinguishing between prod and other envs
      }
    }),
    new HtmlWebpackPlugin({
      template: './src/public/index.html',
      inject: 'body',
    }),
  ]

  if (isBuild) {
    config.plugins.push(
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.optimize.UglifyJsPlugin(),
      new CopyWebpackPlugin([{
        from: root('src/public')
      }])
    )
  }

  config.devServer = {
    contentBase: './src/public',
    historyApiFallback: true,
    stats: 'minimal'
  }

  return config;
}();

function root(args) {
  args = Array.prototype.slice.call(arguments, 0)
  return path.join.apply(path, [__dirname].concat(args))
}
