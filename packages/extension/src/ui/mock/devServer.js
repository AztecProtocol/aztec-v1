/* eslint-disable no-console */
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import {
    choosePort,
    createCompiler,
    prepareUrls,
} from 'react-dev-utils/WebpackDevServerUtils';
import chalk from 'chalk';
import config from '../../../webpack-ui.dev';

const protocol = 'http';
const hostName = 'localhost';
const defaultPort = 8080;

choosePort(hostName, defaultPort).then((port) => {
    let devServer;
    const devSocket = {
        warnings: warnings => devServer.sockWrite(devServer.sockets, 'warnings', warnings),
        errors: errors => devServer.sockWrite(devServer.sockets, 'errors', errors),
    };
    const urls = prepareUrls(protocol, hostName, port);
    const compiler = createCompiler({
        appName: 'extension',
        config,
        devSocket,
        urls,
        useYarn: true,
        webpack,
    });
    devServer = new WebpackDevServer(compiler, {
        clientLogLevel: 'none',
        compress: true,
        // contentBase: './client',
        historyApiFallback: {
            disableDotRule: true,
        },
        hot: true,
        https: protocol === 'https',
        publicPath: '/',
        quiet: true,
    });

    devServer.listen(port, hostName, (err) => {
        if (err) {
            console.log(err);
            return;
        }

        console.log(chalk.cyan(`Starting UI Server on: ${urls.localUrlForBrowser}. This could take a while...`));
    });

    ['SIGINT', 'SIGTERM'].forEach((sig) => {
        process.on(sig, () => {
            devServer.close();
            process.exit();
        });
    });
});
