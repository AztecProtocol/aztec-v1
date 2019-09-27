const path = require('path');

module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current',
                },
            },
        ],
        '@babel/preset-react',
    ],
    plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-transform-runtime',
        [
            'module-resolver',
            {
                root: ['./src'],
                alias: {
                    '~config': './src/config',
                    '~utils': './src/utils',
                    '~database': './src/database',
                    '~background': './src/background',
                    '~content': './src/content',
                    '~client': './src/client',
                    '~ui': './src/ui',
                    'aztec.js': path.resolve(__dirname, '../aztec.js/src'),
                },
            },
        ],
    ],
};
