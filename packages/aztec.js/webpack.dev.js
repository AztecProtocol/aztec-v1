const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const common = require('./webpack.common.js');

const config = {
    mode: 'development',
    devtool: 'inline-source-map',
};

const nodeConfig = merge(common, {
    ...config,
    node: {
        __dirname: false,
        __filename: false,
    },
    output: { filename: 'bundle.node.js' },
    target: 'node',
    plugins: [
        new CopyWebpackPlugin([
            {
                from: 'node_modules/@aztec/bn128/**/*.wasm',
                to: '[name].[ext]',
            },
        ]),
    ],
    resolve: {
        extensions: ['.js', '.json', '.wasm'],
    },
});

const webConfig = merge(common, {
    ...config,
    node: { crypto: true, fs: 'empty' },
    output: { filename: 'bundle.web.js' },
    target: 'web',
    resolve: {
        extensions: ['.js', '.json'],
    },
});

module.exports = [nodeConfig, webConfig];
