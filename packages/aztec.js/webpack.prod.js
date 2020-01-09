const merge = require('webpack-merge');
const common = require('./webpack.common.js');

const config = {
    mode: 'production',
    devtool: '',
};

const nodeConfig = merge(common, {
    ...config,
    node: {
        __dirname: false,
        __filename: false,
    },
    output: { filename: 'bundle.node.js' },
    target: 'node',
});

const webConfig = merge(common, {
    ...config,
    node: { crypto: true },
    output: { filename: 'bundle.web.js' },
    target: 'web',
});

module.exports = [nodeConfig, webConfig];
