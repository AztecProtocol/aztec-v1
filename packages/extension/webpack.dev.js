// Imports: Dependencies
const path = require('path');
require("babel-register");
// Webpack Configuration
const config = {

    // Entry
    entry: './client/scripts/background.js',
    // Output
    output: {
        path: path.resolve(__dirname, './client/build/'),
        filename: 'bundle.js',
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
};
// Exports
module.exports = config;
