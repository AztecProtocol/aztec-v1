const merge = require('webpack-merge');
const webpack = require('webpack');

const common = require('./webpack.common.js');

const config = {
    mode: 'production',
    devtool: 'inline-source-map',
};

const nodeConfig = merge(common, {
    ...config,
    node: {
        __dirname: false,
        __filename: false,
    },
    output: { filename: 'bundle.node.js' },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'process.env.WEBPACK_NODE_ENV': JSON.stringify(true),
        }),
    ],
    target: 'node',
});

const webConfig = merge(common, {
    ...config,
    node: { crypto: true },
    output: { filename: 'bundle.web.js' },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'process.env.WEBPACK_WEB_ENV': JSON.stringify(true),
        }),
    ],
    target: 'web',
});

module.exports = [nodeConfig, webConfig];
