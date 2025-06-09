const { override, addWebpackPlugin } = require('customize-cra');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const BrotliWebpackPlugin = require('brotli-webpack-plugin');

module.exports = override(
  addWebpackPlugin(
    new CompressionWebpackPlugin({
      test: /\.(js|css|html|svg)$/,
      filename: '[path][base].gz',
      algorithm: 'gzip',
      threshold: 10240,
      minRatio: 0.8,
    })
  ),
  addWebpackPlugin(
    new BrotliWebpackPlugin({
      asset: '[path].br[query]',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    })
  )
);
