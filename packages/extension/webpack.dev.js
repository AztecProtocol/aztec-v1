const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    entry: {
        background: './src/background',
        'graphql-inspector': './src/background/services/GraphQLService/inspector',
        content: './src/content',
        client: './src/client',
        ui: './src/ui',
    },
    resolve: {
        extensions: ['mjs', '.js', '.jsx', '.json'],
    },
    output: {
        path: path.resolve(__dirname, './client/build/'),
        filename: 'bundle.[name].js',
    },
    module: {
        rules: [
            {
                test: /\.js/, // assuming the files are named .js.flow
                enforce: 'pre',
                use: ['remove-flow-types-loader'],
            },
            // {
            //     test: /\.jsx?$/,
            //     enforce: 'pre',
            //     exclude: [
            //         path.resolve(__dirname, './../../node_modules/'),
            //         path.resolve(__dirname, './../typed-data/'),
            //         path.resolve(__dirname, './../dev-utils/'),
            //         path.resolve(__dirname, './../aztec.js/'),
            //         path.resolve(__dirname, './../secp256k1/'),
            //         path.resolve(__dirname, './../bn128/'),
            //         '/node_modules/',
            //     ],
            //     use: ['eslint-loader'],
            //     // options: {
            //     //     presets: ['@babel/env'],
            //     // },
            // },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
                // options: {
                //     presets: ['@babel/env'],
                // },
            },
            {
                test: /\.mjs$/,
                include: /node_modules/,
                type: 'javascript/auto',
            },
            {
                test: /\.s?css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    'css-loader',
                ],
            },
            {
                test: /\.(png|woff|woff2|eot|ttf)$/,
                loader: 'file-loader?limit=100000',
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
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
    ],
    watchOptions: {
        aggregateTimeout: 300,
        poll: 1000,
    },
};
