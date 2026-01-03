const path = require('path');

module.exports = {
  entry: './src/core/nafsi.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'nafsi.js',
    library: {
      name: 'Nafsi',
      type: 'window',
      export: 'default'
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  mode: 'production',
  optimization: {
    minimize: true
  },
  devtool: 'source-map'
};
