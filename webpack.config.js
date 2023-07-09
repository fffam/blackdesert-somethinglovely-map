var ExtractTextPlugin = require('extract-text-webpack-plugin')
var autoprefixer = require('autoprefixer')
var webpack = require('webpack')
module.exports = function(config) {
  var obj = {
    //     watch: true,

    entry: config.script.entry,

    output: config.script.output,

    module: {
      loaders: [{
        test: /\.vue$/,
        loader: 'vue'
      }, {
        test: /\.(png|jpg|gif)$/,
        loader: 'url',
        query: {
          // limit for base64 inlining in bytes
          limit: 10000,
          // custom naming format if file is larger than
          // the threshold
          name: 'images/[name].[ext]?[hash]'
        }
      }, {
        test: /\.(json)$/,
        loader: 'url',
        query: {
          // limit for base64 inlining in bytes
          limit: 1,
          // custom naming format if file is larger than
          // the threshold
          name: 'images/[name].[ext]?[hash]'
        }
      }, {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/
      }]
    },
    vue: {
      loaders: {
        sass: ExtractTextPlugin.extract('css!postcss!sass'),
        scss: ExtractTextPlugin.extract('css!postcss!sass'),
        css: ExtractTextPlugin.extract('css!postcss')
      }
    },
    babel: {
      presets: ['es2015'],
      plugins: ['transform-runtime']
    },
    plugins: [
      new ExtractTextPlugin('entry.css')
    ],
    postcss: [autoprefixer]
  };

  if (process.env.NODE_ENV === 'production') {
    obj.plugins = [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        }
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      }),
      new ExtractTextPlugin('entry.css'),
      new webpack.optimize.OccurenceOrderPlugin()
    ]
  } else {
    obj.devtool = '#source-map'
  }

  return obj
}
