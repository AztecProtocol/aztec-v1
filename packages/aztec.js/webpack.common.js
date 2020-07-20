const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: ['./src/index.js'],
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                include: /^[^node_modules]+(src|test)/,
                use: 'eslint-loader',
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true,
                    rootMode: 'upward',
                },
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            regeneratorRuntime: 'var unusedRegeneratorRuntime',
        }),
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        library: 'aztec.js',
        libraryTarget: 'umd',
    },
    performance: {
        hints: 'warning',
        maxAssetSize: 200000,
        maxEntrypointSize: 400000,
    },
};
