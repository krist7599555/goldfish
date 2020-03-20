const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  devServer: {
    contentBase: ['./src'], // both src and output dirs
    inline: true,
    hot: true,
    port: 9000,
  },
  entry: './src/index.ts',
  mode: 'development',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
        // modulesDirectories: ['./node_modules']
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Custom template',
      template: 'src/index.html'
    }),
    new CopyWebpackPlugin([
      { from: 'src/assets', to: 'assets' }
    ])
  ],
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader' },
    ],
  },
}
