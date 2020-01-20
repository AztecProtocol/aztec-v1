const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.mjs$/,
                include: /node_modules/,
                type: 'javascript/auto',
            },
            {
                test: /\.(sa|sc)ss$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: {
                                localIdentName: '[name]_[local]-[hash:base64:3]',
                            },
                            importLoaders: 2,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            // eslint-disable-next-line global-require
                            plugins: () => [require('autoprefixer')],
                            sourceMap: true,
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,

                    },
                    'css-loader',
                ],
            },
            {
                test: /\.(png|jpe?g|gif|woff|woff2|eot|ttf)$/,
                loader: 'file-loader?limit=100000',
                options: {
                    outputPath: 'ui',
                },
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'svg-sprite-loader',
                        options: {
                            name: '[name]_[hash:base64:3]',
                            extract: false,
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './src/ui/mock/index.html'),
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
    ],
};
