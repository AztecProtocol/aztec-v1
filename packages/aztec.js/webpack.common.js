const CleanWebpackPlugin = require('clean-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
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
            {
                test: /\.wasm$/,
                exclude: /node_modules/,
                loader: 'wasm-loader',
            },
        ],
    },
    node: {
        // loads crypto-browserify
        crypto: true,
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        library: 'aztec',
        libraryTarget: 'umd',
    },
    performance: {
        hints: 'warning',
        maxAssetSize: 200000,
        maxEntrypointSize: 400000,
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'process.env.WEBPACK_ENV': JSON.stringify(true),
        }),
    ],
    resolve: {
        extensions: ['.js'],
    },
    target: 'web',
};
