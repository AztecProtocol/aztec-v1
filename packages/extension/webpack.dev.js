const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    entry: {
        aztec: './src/index.js',
        background: './src/background',
        'background-ui': './src/ui/background.jsx',
        ui: './src/ui',
    },
    watchOptions: {
        aggregateTimeout: 300,
        poll: 1000,
    },
});
