const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
    target: 'web',
    resolve: {
        extensions: ['.mjs', '.js', '.jsx', '.json'],
        alias: {
            // TODO: replace with artifacts package
            '~contracts': path.resolve(__dirname, './build/contracts'),
            '~uiModules': path.resolve(__dirname, './src/ui'),
        },
    },
    output: {
        path: path.resolve(__dirname, './build/sdk'),
        filename: '[name].js',
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
                            modules: true,
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
                    'resolve-url-loader',
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
                    outputPath: 'static',
                    publicPath: '/sdk/static',
                    name: '[name].[ext]',
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
        new CopyPlugin([
            {
                from: 'public',
                to: 'public', // will be prefixed with output.path
            },
        ]),
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
        new Dotenv({
            path: './.env.development',
        }),
    ],
};
