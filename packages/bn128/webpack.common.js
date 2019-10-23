const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

// We're not importing @babel/polyfill here because it's already imported by @aztec/bn128
// @see https://github.com/babel/babel-loader/issues/401
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
    output: {
        path: path.resolve(__dirname, 'dist'),
        library: '@aztec/bn128',
        libraryTarget: 'umd',
    },
    performance: {
        hints: 'warning',
        maxAssetSize: 200000,
        maxEntrypointSize: 400000,
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: 'src/**/*.wasm',
                to: '[name].[ext]',
            },
        ]),
    ],
    resolve: {
        extensions: ['.js', '.json'],
    },
};
