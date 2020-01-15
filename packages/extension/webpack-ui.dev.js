const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const common = require('./webpack.common.js');

module.exports = {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    entry: [
        'react-dev-utils/webpackHotDevClient',
        './src/ui/mock',
    ],
    resolve: {
        extensions: ['mjs', '.js', '.jsx', '.json'],
        alias: {
            '~uiModules': path.resolve(__dirname, './src/ui/mock'),
            '~testHelpers': path.resolve(__dirname, './tests/helpers'),
        },
    },
    output: {
        path: path.resolve(__dirname, './client/build/'),
        filename: 'bundle.ui.js',
    },
    module: common.module,
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './src/ui/mock/index.html'),
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
    ],
};
