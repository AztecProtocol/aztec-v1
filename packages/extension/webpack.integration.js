const webpack = require('webpack');
const merge = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const packageJson = require('./package.json');
const common = require('./webpack.common.js');

const commonProduction = {
    mode: 'production',
    devtool: '',
    resolve: {
        alias: {
            '~contracts': '@aztec/contract-artifacts/artifacts',
        },
    },
    optimization: {
        minimize: true,
        usedExports: true,
        sideEffects: true,
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': "'integration'",
            'process.env.SERVE_LOCATION': "'https://staging-sdk.aztecprotocol.com/sdk/aztec.js'",
            __DEV__: false,
        }),
        new webpack.ContextReplacementPlugin(
            /moment[/\\]locale$/,
            'en',
        ),
        new HtmlWebpackPlugin({ // Also generate a test.html
            filename: 'ui.html',
            template: './templates/ui.html',
            version: packageJson.version,
        }),
        new HtmlWebpackPlugin({ // Also generate a test.html
            filename: 'background.html',
            template: './templates/background.html',
            version: packageJson.version,
        }),
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
    },
});

module.exports = [prodConfig, prodApiConfig];
