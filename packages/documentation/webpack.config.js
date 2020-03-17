import webpack from 'webpack';
import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const webpackConfig = (env = 'development', { locale = 'en' } = {}) => {
    const isDevelopment = env === 'development';
    const externals = isDevelopment
        ? []
        : {
              react: {
                  commonjs: 'react',
                  commonjs2: 'react',
                  amd: 'React',
                  root: 'React',
              },
              'react-dom': {
                  commonjs: 'react-dom',
                  commonjs2: 'react-dom',
                  amd: 'ReactDOM',
                  root: 'ReactDOM',
              },
          };

    return {
        resolve: {
            extensions: ['*', '.js', '.jsx', '.json'],
            alias: {
                'rsg-components/Examples/Examples': './Examples',
                'rsg-components/Examples/ExamplesRenderer': './ExamplesRenderer',
                'rsg-components/Markdown/MarkdownHeading': path.resolve(__dirname, 'styleguide/components/MarkdownHeading'),
            },
        },
        resolveLoader: {
            modules: ['src/scripts/modules', 'node_modules'],
        },
        mode: env,
        node: {
            fs: 'empty',
            net: 'empty',
            tls: 'empty',
        },
        entry: ['babel-polyfill', path.resolve(__dirname, 'src/index.js')],
        target: 'web',
        devtool: isDevelopment ? 'cheap-module-source-map' : 'source-map',
        output: {
            path: path.resolve(__dirname, 'dist'),
            publicPath: '/',
            filename: 'bundle.js',
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(env),
            }),
            new webpack.LoaderOptionsPlugin({
                minimize: true,
                debug: false,
                options: {
                    context: __dirname,
                },
            }),
            new webpack.NoEmitOnErrorsPlugin(),
            new MiniCssExtractPlugin({
                filename: '[name].css',
            }),
            new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, new RegExp(locale.toLowerCase())),
            new CopyPlugin([{ from: 'fonts', to: 'fonts' }]),
        ],
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: ['babel-loader'],
                },
                {
                    test: /\.(png|woff|woff2|eot|ttf)$/,
                    loader: 'file-loader?limit=100000',
                },
                {
                    test: /\.(jpe?g|gif|ico)$/i,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: '[name].[ext]',
                            },
                        },
                    ],
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
                                importLoaders: 1,
                                localIdentName: '[name]_[local]__[hash:base64:3]',
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
                                sassOptions: {
                                    includePaths: [path.resolve(__dirname, 'src')],
                                    sourceMap: true,
                                },
                            },
                        },
                        // {
                        //   loader: 'jsToSass-loader',
                        //   options: {
                        //     entry: path.resolve(__dirname, 'src/config/index.js'),
                        //   },
                        // },
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
            ],
        },
        externals,
    };
};

export default webpackConfig;
