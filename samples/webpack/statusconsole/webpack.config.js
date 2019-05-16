const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  // I don't really understand what this does, or why it's needed but it fixes the build: https://github.com/webpack-contrib/css-loader/issues/447
  node: {
    fs: 'empty'
  }
};