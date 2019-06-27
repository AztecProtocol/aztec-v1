// Imports: Dependencies
const path = require('path');
require("babel-register");
// Webpack Configuration
const config = {

    // Entry
    entry: {
        background: './client/scripts/background.js',
        background2: './src/scripts/background.js',
        content: './client/scripts/contentScript.js',
        injected: './client/scripts/injected.js',
    },
    // Output
    output: {
        path: path.resolve(__dirname, './client/build/'),
        filename: 'bundle.[name].js',
    },
    // Loaders
    module: {
        rules : [
            // JavaScript/JSX Files
            {
                test: /\.jsx$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
        ],
    },
    // Plugins
    plugins: [],
    watchOptions: {
        aggregateTimeout: 300,
        poll: 1000,
    },
};
// Exports
module.exports = config;
