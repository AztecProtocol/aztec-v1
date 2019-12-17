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
                    '~': './src',
                },
            },
        ],
    ],
};
