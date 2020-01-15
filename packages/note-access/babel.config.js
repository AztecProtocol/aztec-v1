module.exports = {
    presets: ['@babel/preset-env'],
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
                    '~log': './src/log',
                    '~': './src',
                },
            },
        ],
    ],
};
