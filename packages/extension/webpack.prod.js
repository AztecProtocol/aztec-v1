const webpack = require('webpack');
const merge = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const common = require('./webpack.common.js');

const commonProduction = {
    mode: 'production',
    devtool: '',
    optimization: {
        minimize: true,
        usedExports: true,
        sideEffects: true,
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': "'production'",
            __DEV__: false,
        }),
        new webpack.ContextReplacementPlugin(
            /moment[/\\]locale$/,
            'en',
        ),
    ],
};

const prodConfig = merge(common, commonProduction, {
    entry: {
        background: './src/background',
        'background-ui': './src/ui/background.jsx',
        ui: './src/ui',
    },
});

const prodApiConfig = merge(common, commonProduction, {
    entry: {
        aztec: './src/index.js',
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    mandle: false,
                    keep_classnames: true,
                    keep_fnames: true,
                },
            }),
        ],
        concatenateModules: false,
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
});

module.exports = [prodConfig, prodApiConfig];
